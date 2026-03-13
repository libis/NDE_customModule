import {deepMerge, logRequest, findLocalResource, serveLocalFile} from "./proxy-utils.mjs";
import {readFileSync} from 'fs';
import {fileURLToPath} from 'url';
import {dirname, join, resolve} from 'path';
import {exec} from 'child_process';

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

const PROXY_TARGET = envConfig.host;
const customizationConfigOverride = ndeConfig.customization;

// Resolve configurable proxy URL template
const defaultTemplate = '/nde/home?vid={institution}:{view}&lang=en';
const proxyUrlTemplate = ndeConfig.proxyUrlTemplate || defaultTemplate;
const resolvedPath = proxyUrlTemplate
    .replace(/{institution}/g, envConfig.institution)
    .replace(/{view}/g, envConfig.view);

const proxyUrl = `http://localhost:4201${resolvedPath}`;
console.log(`\n  NDE Proxy URL: ${proxyUrl}\n`);

// Auto-open browser after a short delay to let the dev server start
setTimeout(() => {
    const platform = process.platform;
    const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${cmd} "${proxyUrl}"`);
}, 5000);

// Resolve local resource directories (configurable via nde.localResourceDirs)
const projectRoot = join(__dirname, '..');
const localResourceDirs = (ndeConfig.localResourceDirs || ['./dist'])
    .map(d => resolve(projectRoot, d));

console.log('  Local resource dirs:', localResourceDirs.join(', '), '\n');



const proxyRules = [
  {
    context: [
      '/custom/*/assets',
      '/custom/*/assets/**',
      '/nde/custom/*/assets',
      '/nde/custom/*/assets/**'
    ],
    target: 'not-needed',
    router: (req) => `${req.protocol}://${req.get('host')}`,
    changeOrigin: false,
    logLevel: 'silent',
    pathRewrite: (path) =>
      path.replace(/^\/(?:nde\/)?custom\/[^/]+\/assets\/?/, '/assets/'),
    onProxyReq(proxyReq, req) {
      logRequest(req.originalUrl, {local: true, localFile: 'dev-server/assets'});
    },
  },
  {
    context: ['/primaws/rest/pub/configuration/vid/'],
    target: PROXY_TARGET,
    secure: true,
    changeOrigin: true,
    logLevel: 'silent',
    selfHandleResponse: true,
    onProxyReq(proxyReq, req) {
      logRequest(req.originalUrl);
    },
    onProxyRes(proxyRes, req, res) {
      const chunks = [];
      proxyRes.on('data', chunk => chunks.push(chunk));
      proxyRes.on('end', () => {
        try {
          const bodyStr = Buffer.concat(chunks).toString('utf8');
          const json = JSON.parse(bodyStr);
          // MERGE instead of replace to retain unspecified fields
          json.customization = deepMerge(json.customization || {}, customizationConfigOverride);
          const out = JSON.stringify(json);
          res.setHeader('content-type', 'application/json');
          res.end(out);
        } catch (e) {
          res.end(Buffer.concat(chunks));
        }
      });
    }
  },
  {
    context: [
      '/nde/custom/**'
    ],
    target: 'not-needed',
    router: (req) => `${req.protocol}://${req.get('host')}`,
    secure: true,
    logLevel: 'silent',
    pathRewrite: { '^/nde/custom/.*/': '' },
    onProxyReq(proxyReq, req) {
      logRequest(req.originalUrl, {local: true, localFile: 'dev-server/custom'});
    },
  },
  {
    context: [
      '**', '!/nde/custom/**'
    ],
    target: PROXY_TARGET,
    secure: true,
    changeOrigin: true,
    logLevel: 'silent',
    selfHandleResponse: true,
    onProxyReq(proxyReq, req) {
      // Check local resource directories before proxying
      const localFile = findLocalResource(req.originalUrl, localResourceDirs);
      if (localFile) {
        logRequest(req.originalUrl, {local: true, localFile});
        // Mark the request so onProxyRes knows to serve locally
        req._localFile = localFile;
      } else {
        logRequest(req.originalUrl);
      }
    },
    onProxyRes(proxyRes, req, res) {
      // If a local file was found, serve it instead of the proxy response
      if (req._localFile) {
        // Consume and discard the proxy response
        proxyRes.on('data', () => {});
        proxyRes.on('end', () => {
          serveLocalFile(req._localFile, res);
        });
        return;
      }
      // Otherwise forward the proxy response manually
      // (selfHandleResponse prevents automatic piping, so we do it ourselves)
      res.statusCode = proxyRes.statusCode;
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        try { res.setHeader(key, value); } catch { /* skip hop-by-hop headers */ }
      }
      proxyRes.pipe(res);
    }
  }
];



export default proxyRules;
