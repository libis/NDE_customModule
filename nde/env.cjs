
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const packageJsonPath = path.join(projectRoot, 'package.json');

function normalizeEnv(value) {
  if (!value) return undefined;
  const v = String(value).trim().toLowerCase();
  if (v === '' || v === 'undefined' || v === 'null') return undefined;
  return value;
}

function readNdeConfig() {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (!packageJson.nde) {
    throw new Error("Missing 'nde' section in package.json");
  }
  return packageJson.nde;
}

function resolveEnv(explicitEnv) {
  const ndeConfig = readNdeConfig();

  const selectedEnv =
    normalizeEnv(explicitEnv) ||
    normalizeEnv(process.env.npm_config_env) ||
    normalizeEnv(process.env.BUILD_TARGET) ||
    normalizeEnv(ndeConfig.defaultEnvironment);

  if (!selectedEnv) {
    throw new Error('Missing environment');
  }

  const envConfig = ndeConfig.environments[selectedEnv];

  if (!envConfig) {
    throw new Error(
      `Unknown environment '${selectedEnv}'. Available: ${Object.keys(ndeConfig.environments).join(', ')}`
    );
  }

  return {
    projectRoot,
    ndeConfig,
    selectedEnv,
    envConfig,
    isCentral: selectedEnv === 'central',
    buildTarget: selectedEnv === 'central' ? 'central' : 'view',
    view: selectedEnv === 'central' ? null : selectedEnv,
    generatedDir: path.join(projectRoot, '.nde', 'generated', selectedEnv),
    generatedTsconfigPath: path.join(projectRoot, `tsconfig.generated_${selectedEnv}.json`),
    generatedMappingsPath: path.join(projectRoot, 'src', 'app', 'custom1-module', `customComponentMappings.${selectedEnv}.ts`),
  };
}

function writeIfChanged(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const existing = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, 'utf8')
    : '';

  if (existing !== content) {
    fs.writeFileSync(filePath, content);
    return true;
  }

  return false;
}

module.exports = {
  projectRoot,
  normalizeEnv,
  readNdeConfig,
  resolveEnv,
  writeIfChanged,
};