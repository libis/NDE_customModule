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
const customizationConfigOverride = ndeConfig.customization;

export {resolvedPath, proxyUrl, PROXY_TARGET, customizationConfigOverride, ndeConfig};
