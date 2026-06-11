import {deepMerge, logRequest, findLocalResource, serveLocalFile} from "./proxy-utils.mjs";
import {exec} from 'child_process';
import {proxyUrl, PROXY_TARGET, customizationConfigOverride, ndeConfig} from './proxy-url.mjs';
import {dirname, join, resolve} from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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