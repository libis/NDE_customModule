/**
 * Generates a store manifest from the installed `@libis/primo-shared-state`
 * `.d.ts` files, so the workbench Store tab documents the *exact installed
 * version* of the API (the package is AI-regenerated and bumped over time).
 *
 * Parses the facade (`PrimoStateService`) to discover the domains, then each
 * domain service to extract its selectors (grouped into the select$/Signal/get
 * trio), write helpers, and ⚠️ warning notes. Output is a `.generated.ts` file
 * the panel imports.
 *
 * CommonJS to match the existing `nde/*.js` tooling. Invoked from prebuild.js.
 */
const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const PKG = '@libis/primo-shared-state';
const OUT_REL = 'src/app/workbench/store-manifest.generated.ts';

/** Read the JSDoc comment text attached to a node, if any. */
function jsDocText(node) {
  const docs = node.jsDoc;
  if (!docs || !docs.length) return '';
  const last = docs[docs.length - 1];
  if (typeof last.comment === 'string') return last.comment.trim();
  if (Array.isArray(last.comment))
    return last.comment.map((c) => c.text || '').join('').trim();
  return '';
}

/** Pull ⚠️ paragraphs out of a (multi-line) JSDoc body. */
function extractWarnings(text) {
  if (!text || !text.includes('⚠️')) return [];
  return text
    .split(/\n\s*\n/)
    .filter((p) => p.includes('⚠️'))
    .map((p) => p.replace(/\s+/g, ' ').trim());
}

/** Strip an Observable/Signal/Promise wrapper to its inner type. */
function innerType(t) {
  const m = /^(?:Observable|Signal|Promise)<([\s\S]+)>$/.exec(t.trim());
  return (m ? m[1] : t).trim();
}

/** Canonical grouping key for a selector method name. */
function logicalKey(name) {
  let n = name;
  if (n.startsWith('select')) n = n.slice(6);
  else if (n.startsWith('get')) n = n.slice(3);
  if (n.endsWith('Signal')) n = n.slice(0, -6);
  n = n.replace(/\$$/, '');
  return n.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Pretty label from a selector method name. */
function labelFrom(name) {
  let n = name;
  if (n.startsWith('select')) n = n.slice(6);
  else if (n.startsWith('get')) n = n.slice(3);
  if (n.endsWith('Signal')) n = n.slice(0, -6);
  n = n.replace(/\$$/, '');
  return n ? n.charAt(0).toLowerCase() + n.slice(1) : name;
}

/** Parse one `.d.ts` file and index its class declarations by name. */
function parseClasses(file) {
  const sf = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
  );
  const classes = {};
  sf.forEachChild((node) => {
    if (ts.isClassDeclaration(node) && node.name) {
      classes[node.name.text] = { node, sf };
    }
  });
  return classes;
}

/** Extract members (methods + properties) from a class node. */
function membersOf(entry) {
  const { node, sf } = entry;
  const methods = [];
  const properties = [];
  for (const m of node.members) {
    const name = m.name && m.name.getText(sf);
    if (!name) continue;
    if (ts.isMethodDeclaration(m) || ts.isMethodSignature(m)) {
      methods.push({
        name,
        returnType: m.type ? m.type.getText(sf) : 'void',
        params: (m.parameters || []).map((p) => ({
          name: p.name.getText(sf),
          type: p.type ? p.type.getText(sf) : 'any',
        })),
        jsdoc: jsDocText(m),
      });
    } else if (ts.isPropertyDeclaration(m) || ts.isPropertySignature(m)) {
      properties.push({
        name,
        type: m.type ? m.type.getText(sf) : 'any',
        jsdoc: jsDocText(m),
      });
    }
  }
  return { methods, properties, classJsDoc: jsDocText(node) };
}

/** Classify a method by its return type / name. */
function classify(method) {
  const rt = method.returnType;
  if (rt.startsWith('Observable<')) return 'observable';
  if (rt.startsWith('Signal<')) return 'signal';
  if (rt.startsWith('Promise<')) return 'promise';
  if (method.name === 'dispatch') return 'dispatch';
  if (rt === 'void') return 'setter';
  return 'other';
}

function buildDomain(domainProp, serviceEntry) {
  const { methods, classJsDoc } = membersOf(serviceEntry);

  const fieldMap = new Map();
  const writes = [];
  let hasDispatch = false;

  for (const m of methods) {
    const kind = classify(m);
    if (kind === 'dispatch') {
      hasDispatch = true;
      continue;
    }
    if (kind === 'setter') {
      writes.push({ name: m.name, params: m.params, jsdoc: m.jsdoc });
      continue;
    }
    if (kind === 'observable' || kind === 'signal' || kind === 'promise') {
      // Skip parameterised selectors (e.g. selectDocById$(id)) — they aren't
      // bindable to a single live value without an argument.
      const key = logicalKey(m.name);
      const f = fieldMap.get(key) || {
        key,
        label: '',
        type: '',
        jsdoc: '',
        variants: {},
        _hasArgs: false,
      };
      f.variants[kind] = m.name;
      if (m.params.length) f._hasArgs = true;
      if (kind === 'observable') {
        f.label = labelFrom(m.name);
        f.type = innerType(m.returnType);
        if (m.jsdoc) f.jsdoc = m.jsdoc;
      }
      if (!f.label) f.label = labelFrom(m.name);
      if (!f.type) f.type = innerType(m.returnType);
      if (!f.jsdoc && m.jsdoc) f.jsdoc = m.jsdoc;
      fieldMap.set(key, f);
    }
  }

  const fields = Array.from(fieldMap.values()).map((f) => {
    f.hasArgs = f._hasArgs;
    delete f._hasArgs;
    return f;
  });

  return {
    name: domainProp.name,
    service: domainProp.type,
    description: (domainProp.jsdoc || classJsDoc.split('\n')[0] || '').trim(),
    writable: writes.length > 0,
    hasDispatch,
    warnings: extractWarnings(classJsDoc),
    fields,
    writes,
  };
}

function extractStoreManifest(projectRoot) {
  const pkgDir = path.resolve(projectRoot, 'node_modules', PKG);
  const stateDir = path.join(pkgDir, 'dist', 'state');
  const version = JSON.parse(
    fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'),
  ).version;

  // Index every class across the state services.
  const allClasses = {};
  for (const file of fs.readdirSync(stateDir)) {
    if (!file.endsWith('.d.ts')) continue;
    Object.assign(allClasses, parseClasses(path.join(stateDir, file)));
  }

  const facade = allClasses['PrimoStateService'];
  if (!facade) throw new Error('PrimoStateService not found in ' + stateDir);
  const { properties } = membersOf(facade);

  const domains = [];
  for (const prop of properties) {
    const serviceEntry = allClasses[prop.type];
    if (!serviceEntry) continue; // skip non-service properties
    domains.push(buildDomain(prop, serviceEntry));
  }

  const manifest = {
    version,
    generatedAt: new Date().toISOString(),
    domains,
  };

  const out = path.resolve(projectRoot, OUT_REL);
  const banner =
    '// AUTO-GENERATED by nde/extract-store-manifest.js — DO NOT EDIT.\n' +
    `// Source: ${PKG}@${version} type definitions.\n`;
  const body =
    banner +
    "import type { StoreManifest } from './store-manifest.types';\n\n" +
    'export const STORE_MANIFEST: StoreManifest = ' +
    JSON.stringify(manifest, null, 2) +
    ';\n';
  fs.writeFileSync(out, body);

  const fieldCount = domains.reduce((n, d) => n + d.fields.length, 0);
  console.log(
    `[extract-store-manifest] ${PKG}@${version}: ${domains.length} domains, ${fieldCount} fields → ${OUT_REL}`,
  );
  return manifest;
}

module.exports = { extractStoreManifest };

// Allow direct invocation: `node nde/extract-store-manifest.js`
if (require.main === module) {
  extractStoreManifest(path.resolve(__dirname, '..'));
}
