const fs = require('fs');
const path = require('path');

const {
  resolveEnv,
  writeIfChanged,
} = require('./env.cjs');

const explicitEnv = process.argv[2];
const {
  projectRoot,
  selectedEnv,
  envConfig,
  isCentral,
  generatedTsconfigPath,
  generatedMappingsPath,
  generatedAssetBaseOutPath,
} = resolveEnv(explicitEnv);

process.env.BUILD_TARGET = selectedEnv;
process.env.npm_config_env = selectedEnv;

console.log(`👉 Prebuild for env: ${selectedEnv}`);

console.log(`✔ projectRoot: ${projectRoot}`);
console.log(`✔ generatedTsconfigPath: ${generatedTsconfigPath}`);
console.log(`✔ generatedMappingsPath: ${generatedMappingsPath}`);


const rootTsConfig = JSON.parse(
  fs.readFileSync(
    path.join(projectRoot, 'tsconfig.json'),
    'utf8'
  )
);

const existingPaths =
  rootTsConfig.compilerOptions?.paths || {};

const relativeAssetBaseOutPath =
  path.relative(
    path.dirname(generatedTsconfigPath),
    generatedAssetBaseOutPath
  ).replace(/\\/g, '/');

const assetBaseUrl = envConfig.assetBaseUrl || envConfig.host || '';

writeIfChanged(
  generatedAssetBaseOutPath,
  `export const assetBaseUrl = '${assetBaseUrl}';\n`
);

const relativeMappingsPath =
  path.relative(
    path.dirname(generatedTsconfigPath),
    generatedMappingsPath
  ).replace(/\\/g, '/');

const relativeTsConfigAppPath =
  path.relative(
    path.dirname(generatedTsconfigPath),
    path.join(projectRoot, "./tsconfig.app.json")
  ).replace(/\\/g, '/');

const relativeSrcPath =
  path.relative(
    path.dirname(generatedTsconfigPath),
    path.join(projectRoot, 'src')
  ).replace(/\\/g, '/');


const tsconfig = {
  extends: "./tsconfig.app.json",
  compilerOptions: {
    rootDir: "./",
    paths: {
      ...existingPaths,
      "@nde/component-mappings": [
        relativeMappingsPath
      ],
      "@nde/asset-base": [
        relativeAssetBaseOutPath
      ]
    }
  },
  include: [
    "./src/*.ts",
    relativeMappingsPath,
    relativeAssetBaseOutPath
  ],
  exclude: [
    "./src/**/*.spec.ts",
    "./src/test.ts"
  ]
};

writeIfChanged(
  generatedTsconfigPath,
  JSON.stringify(tsconfig, null, 2) + '\n'
);

console.log(`✔ Generated generatedTsconfigPath: ${generatedTsconfigPath}`);
console.log(`✔ relativeMappingsPath : ${relativeMappingsPath}`);
console.log(`✔ relativeAssetBaseOutPath : ${relativeAssetBaseOutPath}`);

console.log(`✔ Asset base: ${assetBaseUrl}`);
console.log('✅ Prebuild completed successfully');