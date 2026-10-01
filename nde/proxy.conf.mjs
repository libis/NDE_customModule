import {
  buildMergedManifestResponse, 
  createLocalCustomModuleAssetManifest, 
  deepMerge, 
  getAssetRelativePath, 
  isCustomModuleAssetManifestRequest, 
  proxyAgent, 
  resolveCustomModuleManifestPath, 
  resolveLocalAssetFilePath,
  getCentralCodeRelativePath,
  getCentralRelativePath,
  resolveLocalCentralFilePath,
  serveLocalFile,
  logRequest
} from "./proxy-utils.mjs";
import fs from 'node:fs';
import {exec} from 'child_process';
import {proxyUrl, PROXY_TARGET, customizationConfigOverride, ndeConfig} from './proxy-url.mjs';
import path from 'node:path';
import {dirname, join, resolve} from 'path';
import {fileURLToPath} from 'url';

import open from 'open';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

process.env.PROXY_TRACE = '1';
console.log('PROXY_TRACE=', process.env.PROXY_TRACE);

console.log(`\n  NDE Proxy URL: ${proxyUrl}\n`);

const env = process.env.BUILD_TARGET || ndeConfig.defaultEnvironment;

process.env.ENV  = env
process.env.VIEW = ndeConfig.environments[env].view;
process.env.INST = ndeConfig.environments[env].institution;
process.env.CENTRAL_CODE = ndeConfig.environments["central"].institution;


// Auto-open browser after a short delay to let the dev server start
// setTimeout(() => {
//     const platform = process.platform;
//     const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
//     exec(`${cmd} "${proxyUrl}"`);
// }, 5000);


setTimeout(async () => {
  await open(proxyUrl);
}, 5000);


// Resolve local resource directories (configurable via nde.localResourceDirs)
const projectRoot = join(__dirname, '..');
const localResourceDirs = (ndeConfig.localResourceDirs || ['./dist'])
    .map(d => resolve(projectRoot, d));

console.log('  Local resource dirs:', localResourceDirs.join(', '), '\n');


const assetContentTypes = {
  '.css': 'text/css',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function getAssetContentType(filePath) {
  return assetContentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

async function serveCustomModuleManifest(req, res) {
  const manifestPath = resolveCustomModuleManifestPath(req.url);
  if (!manifestPath) {
    return false;
  }

  try {
    const response = await buildMergedManifestResponse(req.url, manifestPath, PROXY_TARGET);
    res.writeHead(response.statusCode, response.headers);
    res.end(response.body);
    return true;
  } catch (error) {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: `Unable to read Custom Module asset manifest from ${manifestPath}: ${error.message}` }));
    return true;
  }
}


const proxyRules = [  

  // '/nde/home', '/home'
  {
    context: ['/nde/home', '/home'],
    target: PROXY_TARGET,
    agent: proxyAgent,
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
    selfHandleResponse: true,
    onProxyRes(proxyRes, req, res) {
      console.log("['/nde/home', '/home'] req.url: ", req.url);
      const chunks = [];
      proxyRes.on('data', chunk => chunks.push(chunk));
      proxyRes.on('end', () => {
        const body = Buffer.concat(chunks);
        res.statusCode = proxyRes.statusCode || 200;
        res.setHeader('content-type', proxyRes.headers['content-type'] || 'text/html; charset=utf-8');
        res.end(body);
      });
    }
  },

    // '/nde/custom/*/CENTRAL_CODE.txt'
  {
    context: [
      '/nde/custom/*/CENTRAL_CODE.txt'
    ],
    target: PROXY_TARGET,
    secure: true,
    changeOrigin: true,
    logLevel: 'debug',
    selfHandleResponse: true,

    onProxyReq(proxyReq, req) {
      console.log("['/nde/custom/*/CENTRAL_CODE.txt'] req.url: ", req.url);
      const relativePath = getCentralCodeRelativePath(req.url);
      const localFile = relativePath ? resolveLocalAssetFilePath(relativePath) : null;
      if (process.env.PROXY_TRACE) {
        if (localFile) {
          console.log(`[asset-trace] ${req.url} -> LOCAL ${localFile}`);
        } else {
          console.log(`[asset-trace] ${req.url} -> REMOTE ${PROXY_TARGET}${req.url}`);
        }
      }
      req._localFile = localFile    
    },
    onProxyRes(proxyRes, req, res) {
      if (req._localFile) {
        serveLocalFile(req._localFile, res);
        return;
      }
      proxyRes.pipe(res);
    },
  },


  // '/custom/*/asset-manifest.json', '/nde/custom/*/asset-manifest.json'
  {
    context: ['/custom/*/asset-manifest.json', '/nde/custom/*/asset-manifest.json'],
    target: PROXY_TARGET,
    agent: proxyAgent,
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
    selfHandleResponse: true,
    onProxyRes(proxyRes, req, res) {
      serveCustomModuleManifest(req, res).then((handled) => {
        if (handled) {
          return;
        }

        const chunks = [];
        proxyRes.on('data', chunk => chunks.push(chunk));
        proxyRes.on('end', () => {
          const body = Buffer.concat(chunks);
          res.statusCode = proxyRes.statusCode || 200;
          res.setHeader('content-type', proxyRes.headers['content-type'] || 'application/json');
          res.end(body);
        });
      });
    }
  },

  // '/nde/custom/.*-CENTRAL_PACKAGE/*', '/nde/custom/.*-CENTRAL_PACKAGE/**'
  {
    context: (pathname) => pathname.match(/^\/nde\/custom\/[^/]+-CENTRAL_PACKAGE\//),
    
    target: PROXY_TARGET,
    secure: true,
    changeOrigin: true,
    logLevel: 'debug',
    selfHandleResponse: false,
    
    onProxyReq(proxyReq, req) {
      const relativePath = getCentralRelativePath(req.url);
      const localFile = relativePath ? resolveLocalCentralFilePath(relativePath) : null;

      if (process.env.PROXY_TRACE) {
        if (localFile) {
          console.log(`[asset-trace] ${req.url} -> LOCAL ${localFile}`);
        } else {
          console.log(`[asset-trace] ${req.url} -> REMOTE ${PROXY_TARGET}${req.url}`);
        }
      }
      req._localFile = localFile 
    },
    onProxyRes(proxyRes, req, res) {
      if (req._localFile) {
        serveLocalFile(req._localFile, res);
        return;
      }
      res.statusCode = proxyRes.statusCode;
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        try { res.setHeader(key, value); } catch {}
      }
      proxyRes.pipe(res);
    }
  },

  //  '/custom/*/assets', '/custom/*/assets/**','/nde/custom/*/assets', '/nde/custom/*/assets/**'
  {
    context: [
      '/custom/*/assets',
      '/custom/*/assets/**',
      '/nde/custom/*/assets',
      '/nde/custom/*/assets/**'
    ],
    target: PROXY_TARGET,
    agent: proxyAgent,
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',

    onProxyReq(proxyReq, req) {
      const relativePath = getAssetRelativePath(req.url);
      const localFile = relativePath ? resolveLocalAssetFilePath(relativePath) : null;
      if (process.env.PROXY_TRACE) {
        if (localFile) {
          console.log(`[asset-trace] ${req.url} -> LOCAL ${localFile}`);
        } else {
          console.log(`[asset-trace] ${req.url} -> REMOTE ${PROXY_TARGET}${req.url}`);
        }
      }
      req._localFile = localFile 
    },
    onProxyRes(proxyRes, req, res) {
      if (req._localFile) {
        serveLocalFile(req._localFile, res);
        return;
      }
      proxyRes.pipe(res);
    },
  },



  
    // '/nde/custom/**'
  {
    context: [
      '/nde/custom/**'
    ],
    target: 'not-needed',
    router: (req) => {
      const url = `${req.protocol}://${req.get('host')}`
      console.log(url);
      return url;

    },
    secure: false,
    logLevel: 'debug',
    pathRewrite: { '^/nde/custom/.*/': '' },
    onProxyReq(proxyReq, req) {
      logRequest(req.originalUrl, {local: true, localFile: 'dev-server/custom'});
    },
  },

  // /primaws/rest/pub/configuration/vid/'
  {
    context: ['/primaws/rest/pub/configuration/vid/'],
    target: PROXY_TARGET,
    agent: proxyAgent,
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
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

  //'**', '!/nde/custom/**', '!/nde/home', '!/home', '!/assets/**', '!/.well-known/**'
  {
    context: [
      '**', '!/nde/custom/**', '!/nde/home', '!/home', '!/assets/**', '!/.well-known/**'
    ],
    target: PROXY_TARGET,
    agent: proxyAgent,
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
    selfHandleResponse: false,
    onProxyReq(proxyReq, req) {
      logRequest(req.originalUrl, {local: true, localFile: 'dev-server/custom'});
    },
    // onProxyReq(proxyReq, req) {
    //   // Check local resource directories before proxying
    //   const localFile = findLocalResource(req.originalUrl, localResourceDirs);
    //   if (localFile) {
    //     logRequest(req.originalUrl, {local: true, localFile});
    //     // Mark the request so onProxyRes knows to serve locally
    //     req._localFile = localFile;
    //   } else {
    //     logRequest(req.originalUrl);
    //   }
    // },
    // onProxyRes(proxyRes, req, res) {    
    //   // If a local file was found, serve it instead of the proxy response
    //   if (req._localFile) {
    //     // Consume and discard the proxy response
    //     proxyRes.on('data', () => {});
    //     proxyRes.on('end', () => {
    //       serveLocalFile(req._localFile, res);
    //     });
    //     return;
    //   }
    //   // Otherwise forward the proxy response manually
    //   // (selfHandleResponse prevents automatic piping, so we do it ourselves)
    //   res.statusCode = proxyRes.statusCode;
    //   for (const [key, value] of Object.entries(proxyRes.headers)) {
    //     try { res.setHeader(key, value); } catch { /* skip hop-by-hop headers */ }
    //   }
    //   proxyRes.pipe(res);
    // }
  }
];

export default proxyRules;