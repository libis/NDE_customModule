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
} = resolveEnv(explicitEnv);

process.env.BUILD_TARGET = selectedEnv;
process.env.npm_config_env = selectedEnv;

console.log(`👉 Prebuild for env: ${selectedEnv}`);

const assetBaseOutPath = path.resolve(
  projectRoot,
  '.nde',
  'generated',
  selectedEnv,
  'asset-base.generated.ts'
);

const assetBaseUrl = envConfig.assetBaseUrl || envConfig.host || '';

writeIfChanged(
  assetBaseOutPath,
  `export const assetBaseUrl = '${assetBaseUrl}';\n`
);


const relativeMappingsPath =
  path.relative(
    path.dirname(generatedTsconfigPath),
    generatedMappingsPath
  ).replace(/\\/g, '/');


const tsconfig = {
  extends: "./tsconfig.app.json",
  compilerOptions: {
    rootDir: "./",
    paths: {
      "src/*": [
        "./src/*"
      ],
      "@nde/component-mappings": [
        relativeMappingsPath
      ],
      "@nde/asset-base": [
        "./asset-base.generated.ts"
      ]
    }
  },
  include: [
    "./src/*.ts",
    relativeMappingsPath,
    "./asset-base.generated.ts"
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

console.log(`✔ Generated env tsconfig: ${generatedTsconfigPath}`);
console.log(`✔ Generated mapping target: ${generatedMappingsPath}`);
console.log(`✔ Relative mapping : ${relativeMappingsPath}`);
console.log(`✔ Asset base: ${assetBaseUrl}`);
console.log('✅ Prebuild completed successfully');