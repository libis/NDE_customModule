import {readFileSync} from 'fs';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const ndeConfig = packageJson.nde;

if (!ndeConfig) {
    console.error("Error: 'nde' section not found in package.json!");
    process.exit(1);
}

const defaultEnv = ndeConfig.defaultEnvironment;
const envConfig = ndeConfig.environments[defaultEnv];

if (!envConfig) {
    console.error(`Error: Environment '${defaultEnv}' not found in package.json nde.environments!`);
    process.exit(1);
}

// Resolve configurable proxy URL template
const defaultTemplate = '/nde/home?vid={institution}:{view}&lang=en';
const proxyUrlTemplate = ndeConfig.proxyUrlTemplate || defaultTemplate;
const resolvedPath = proxyUrlTemplate
    .replace(/{institution}/g, envConfig.institution)
    .replace(/{view}/g, envConfig.view);

const proxyUrl = `http://localhost:4201${resolvedPath}`;
const PROXY_TARGET = envConfig.host;

// Resolve configurable assets URL template — used to prefix every relative
// path in the active environment's `assets` block so it ends up as a fully
// qualified custom-package URL (e.g. custom/<institution>-<view>/assets/...).
const defaultAssetsTemplate = 'custom/{institution}-{view}/assets';
const assetsUrlTemplate = ndeConfig.assetsUrlTemplate || defaultAssetsTemplate;
const resolvedAssetsPrefix = assetsUrlTemplate
    .replace(/{institution}/g, envConfig.institution)
    .replace(/{view}/g, envConfig.view)
    .replace(/\/+$/, '');

function resolveAssetPaths(node) {
    if (typeof node === 'string') {
        // Leave absolute URLs and root-relative paths untouched.
        if (/^(https?:)?\/\//.test(node) || node.startsWith('/')) return node;
        return `${resolvedAssetsPrefix}/${node.replace(/^\/+/, '')}`;
    }
    if (Array.isArray(node)) return node.map(resolveAssetPaths);
    if (node && typeof node === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(node)) out[k] = resolveAssetPaths(v);
        return out;
    }
    return node;
}

// Prefer the per-environment `assets` block; fall back to the legacy
// top-level `customization` block for backward compatibility.
const customizationConfigOverride = envConfig.assets
    ? resolveAssetPaths(envConfig.assets)
    : (ndeConfig.customization || {});

export {resolvedPath, proxyUrl, PROXY_TARGET, customizationConfigOverride, ndeConfig};
