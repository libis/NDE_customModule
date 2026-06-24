const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const packageJsonPath = path.resolve(projectRoot, 'package.json');
const bootstrapPath = path.resolve(projectRoot, 'src/bootstrap.ts');
const mainPath = path.resolve(projectRoot, 'src/main.ts');
const webpackConfigPath = path.resolve(projectRoot, 'webpack.config.js');
const assetBaseOutPath = path.resolve(projectRoot, 'src/app/state/asset-base.generated.ts');

if (!fs.existsSync(packageJsonPath)) {
    console.error("Error: package.json file not found!");
    process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const ndeConfig = packageJson.nde;

if (!ndeConfig) {
    console.error("Error: 'nde' section not found in package.json!");
    process.exit(1);
}

const selectedEnv = process.env.BUILD_TARGET || ndeConfig.defaultEnvironment;
const envConfig = ndeConfig.environments[selectedEnv];

if (!envConfig) {
  console.error(`Error: Environment '${selectedEnv}' not found in package.json nde.environments!`);
  console.error(`Invalid environment: ${selectedEnv}`);
  console.error('Available environments:', Object.keys(ndeConfig.environments));
  process.exit(1);
}

console.log(`👉 Prebuild for env: ${selectedEnv}`);

if (selectedEnv === 'central'){
  const tsconfig = {
    extends: "./tsconfig.app.json",
    compilerOptions: {
      paths: {
        "src/*": [
          "./src/*"
        ],
        "@nde/component-mappings": [
          `./src/app/custom1-module/customComponentMappings.central.ts`
        ]
      }
    },
    include: [
      "src/*",
      "src/app/custom1-module/customComponentMappings.central.ts"
    ]
  };

  fs.writeFileSync("tsconfig.generated.json", JSON.stringify(tsconfig, null, 2));
}

if (selectedEnv !== 'central'){

  const view = process.env.BUILD_TARGET;

  const tsconfig = {
    extends: "./tsconfig.app.json",
    compilerOptions: {
      paths: {
        "src/*": [
          "./src/*" 
        ],
        "@nde/component-mappings": [
          `./src/app/custom1-module/customComponentMappings.generated.ts`
        ]
      }
    },
    include: [
      "src/*",
      `./src/app/custom1-module/customComponentMappings.generated.ts`
    ]
  };

  fs.writeFileSync("tsconfig.generated.json", JSON.stringify(tsconfig, null, 2));
}

const addonName = envConfig.addonName;
const defaultName = "CustomModule"

const assetBaseUrl = envConfig.assetBaseUrl || envConfig.host || '';

console.log('Env config:', envConfig);
console.log('Extracted assetBaseUrl:', assetBaseUrl);

fs.writeFileSync(assetBaseOutPath, `export const assetBaseUrl = '${assetBaseUrl}';\n`);
console.log(`✔ Written to ${assetBaseOutPath}:\nexport const assetBaseUrl = '${assetBaseUrl}';`);

console.log('✅ Prebuild completed successfully! with env ' + selectedEnv);
