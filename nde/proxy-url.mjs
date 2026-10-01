import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

const ndeConfig = packageJson.nde;

if (!ndeConfig) {
  console.error("Error: 'nde' section not found in package.json.");
  process.exit(1);
}

if (!ndeConfig.environments) {
  console.error("Error: 'nde.environments' section not found in package.json.");
  process.exit(1);
}

/*
 * npm converts:
 *
 *   npm run start:proxy -- --env=sqa
 *
 * into:
 *
 *   process.env.npm_config_env === 'sqa'
 *
 * BUILD_TARGET can also be supplied directly as an environment variable.
 */
const selectedEnv =
  process.env.npm_config_env ||
  process.env.BUILD_TARGET ||
  ndeConfig.defaultEnvironment;

if (!selectedEnv) {
  console.error(
    "Error: No environment selected and 'nde.defaultEnvironment' is not configured."
  );
  process.exit(1);
}

const envConfig = ndeConfig.environments[selectedEnv];

if (!envConfig) {
  const availableEnvironments = Object.keys(ndeConfig.environments);

  console.error(
    `Error: Environment '${selectedEnv}' not found in package.json nde.environments.`
  );

  console.error(
    `Available environments: ${availableEnvironments.join(', ')}`
  );

  process.exit(1);
}

if (!envConfig.institution || !envConfig.view || !envConfig.host) {
  console.error(
    `Error: Environment '${selectedEnv}' must define institution, view and host.`
  );
  process.exit(1);
}

process.env.BUILD_TARGET = selectedEnv;

/*
 * This must correspond to the port used by "ng serve".
 */
const devServerPort = Number(
  process.env.npm_config_port ||
  process.env.PORT ||
  ndeConfig.devServerPort ||
  4201
);

const defaultProxyUrlTemplate =
  '/nde/home?vid={institution}:{view}&lang=en';

const proxyUrlTemplate =
  ndeConfig.proxyUrlTemplate || defaultProxyUrlTemplate;

function resolveTemplate(template) {
  return template
    .replace(/{institution}/g, envConfig.institution)
    .replace(/{view}/g, envConfig.view);
}

const resolvedPath = resolveTemplate(proxyUrlTemplate);

/*
 * Plain JavaScript string, not an HTML <a> element.
 */
const proxyUrl = `http://localhost:${devServerPort}${resolvedPath}`;
const PROXY_TARGET = envConfig.host;

/*
 * Prefix relative asset paths with:
 *
 * custom/<institution>-<view>/assets
 */
const defaultAssetsTemplate =
  'custom/{institution}-{view}/assets';

const assetsUrlTemplate =
  ndeConfig.assetsUrlTemplate || defaultAssetsTemplate;

const resolvedAssetsPrefix = resolveTemplate(assetsUrlTemplate)
  .replace(/^\/+/, '')
  .replace(/\/+$/, '');

function resolveAssetPaths(node) {
  if (typeof node === 'string') {
    // Preserve absolute URLs and root-relative paths.
    if (/^(https?:)?\/\//.test(node) || node.startsWith('/')) {
      return node;
    }

    return `${resolvedAssetsPrefix}/${node.replace(/^\/+/, '')}`;
  }

  if (Array.isArray(node)) {
    return node.map(resolveAssetPaths);
  }

  if (node && typeof node === 'object') {
    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => [
        key,
        resolveAssetPaths(value),
      ])
    );
  }

  return node;
}

/*



 * Prefer environment-specific assets. Retain the legacy top-level
 * customization block as fallback.
 */
const customizationConfigOverride = envConfig.assets
  ? resolveAssetPaths(envConfig.assets)
  : ndeConfig.customization || {};

export {
  selectedEnv,
  resolvedPath,
  proxyUrl,
  PROXY_TARGET,
  customizationConfigOverride,
  ndeConfig,
  envConfig,
};