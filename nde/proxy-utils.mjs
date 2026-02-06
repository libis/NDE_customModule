import {existsSync, readFileSync, statSync} from 'fs';
import {join, extname} from 'path';
import {lookup} from 'mrmime';

// ANSI color codes
const COLORS = {
  reset:   '\x1b[0m',
  dim:     '\x1b[2m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  cyan:    '\x1b[36m',
  magenta: '\x1b[35m',
  white:   '\x1b[37m',
};

// Added deepMerge utility to retain unspecified fields
export function deepMerge(target, source) {
  if (typeof target !== 'object' || target === null) return source;
  if (typeof source !== 'object' || source === null) return source;
  const out = Array.isArray(target) ? [...target] : {...target};
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof out[k] === 'object' && out[k] !== null && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Log every proxy request path to the console.
 * Local hits are printed in green, remote proxied requests in cyan.
 */
export function logRequest(reqPath, {local = false, localFile = null} = {}) {
  const timestamp = new Date().toLocaleTimeString();
  if (local) {
    console.log(
      `${COLORS.dim}${timestamp}${COLORS.reset} ` +
      `${COLORS.green}LOCAL ${COLORS.reset} ` +
      `${COLORS.green}${reqPath}${COLORS.reset}` +
      `${COLORS.dim} → ${localFile}${COLORS.reset}`
    );
  } else {
    console.log(
      `${COLORS.dim}${timestamp}${COLORS.reset} ` +
      `${COLORS.cyan}PROXY ${COLORS.reset} ` +
      `${COLORS.white}${reqPath}${COLORS.reset}`
    );
  }
}

/**
 * Search for a request path inside the configured local resource directories.
 * Returns the absolute path of the first match, or null if not found.
 *
 * @param {string} reqPath  - The URL path (e.g. "/nde/custom/foo/bar.js")
 * @param {string[]} dirs   - Absolute paths to local resource directories
 * @returns {string|null}
 */
export function findLocalResource(reqPath, dirs) {
  // Strip leading slash and query string
  const cleanPath = reqPath.replace(/\?.*$/, '').replace(/^\/+/, '');
  for (const dir of dirs) {
    const candidate = join(dir, cleanPath);
    try {
      if (existsSync(candidate) && statSync(candidate).isFile()) {
        return candidate;
      }
    } catch {
      // Ignore permission or other FS errors
    }
  }
  return null;
}

/**
 * Serve a local file and end the response.
 *
 * @param {string} filePath - Absolute path to the local file
 * @param {import('http').ServerResponse} res
 */
export function serveLocalFile(filePath, res) {
  const content = readFileSync(filePath);
  const ext = extname(filePath);
  const mime = lookup(ext) || 'application/octet-stream';
  res.setHeader('content-type', mime);
  res.setHeader('x-served-from', 'local');
  res.end(content);
}
