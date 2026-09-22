const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const {
  resolveEnv,
  writeIfChanged,
} = require('./env.cjs');

const explicitEnv = process.argv[2];

const {
  projectRoot,
  selectedEnv,
  generatedTsconfigPath,
} = resolveEnv(explicitEnv);

console.log(`Preparing Angular dev server for environment: ${selectedEnv}`);

const prebuildScriptPath = path.join(__dirname, 'prebuild.js');

const result = spawnSync(
  process.execPath,
  [prebuildScriptPath, selectedEnv],
  {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      BUILD_TARGET: selectedEnv,
      npm_config_env: selectedEnv,
    },
  }
);

if (result.error) {
  throw new Error(
    `Failed to execute prebuild script: ${result.error.message}`
  );
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

if (!fs.existsSync(generatedTsconfigPath)) {
  throw new Error(
    `Expected generated tsconfig was not created: ${generatedTsconfigPath}`
  );
}

const activeTsconfigPath = path.join(
  projectRoot,
  'tsconfig.generated.json'
);

const relativeGeneratedTsconfigPath = path
  .relative(
    path.dirname(activeTsconfigPath),
    generatedTsconfigPath
  )
  .replace(/\\/g, '/');

const extendsPath = relativeGeneratedTsconfigPath.startsWith('.')
  ? relativeGeneratedTsconfigPath
  : `./${relativeGeneratedTsconfigPath}`;

const activeTsconfig = {
  extends: extendsPath,
};

const changed = writeIfChanged(
  activeTsconfigPath,
  `${JSON.stringify(activeTsconfig, null, 2)}\n`
);

console.log(
  changed
    ? `Created active tsconfig: ${activeTsconfigPath}`
    : `Active tsconfig already up to date: ${activeTsconfigPath}`
);

console.log(`Active environment: ${selectedEnv}`);
console.log(`Active tsconfig extends: ${extendsPath}`);
console.log('Angular dev-server preparation completed successfully');