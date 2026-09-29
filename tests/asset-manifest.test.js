const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { writeAssetManifest, normalizeManifestPath, collectAssetManifest } = require('../postbuild.js');

test('writeAssetManifest creates sorted relative manifest and ignores stale manifest', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-manifest-'));
  const outputRoot = path.join(tempRoot, 'dist', 'custom-module');
  fs.mkdirSync(path.join(outputRoot, 'assets', 'images', 'icons'), { recursive: true });

  const files = [
    'remoteEntry.js',
    'assets/custom.css',
    'assets/images/logo.svg',
    'assets/images/icons/test.svg',
  ];

  for (const relativePath of files) {
    const fullPath = path.join(outputRoot, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, 'content');
  }

  const staleManifestPath = path.join(outputRoot, 'asset-manifest.json');
  fs.writeFileSync(staleManifestPath, JSON.stringify({ files: ['old.js'], directories: ['old'] }));

  const manifestPath = writeAssetManifest(outputRoot);
  const secondManifestPath = writeAssetManifest(outputRoot);

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const secondManifest = JSON.parse(fs.readFileSync(secondManifestPath, 'utf8'));
  assert.deepEqual(manifest, {
    files: [
      'assets/custom.css',
      'assets/images/icons/test.svg',
      'assets/images/logo.svg',
      'remoteEntry.js',
    ],
    directories: [
      'assets',
      'assets/images',
      'assets/images/icons',
    ],
  });

  assert.deepEqual(secondManifest, manifest);
  assert.equal(new Set(manifest.directories).size, manifest.directories.length);
  assert.equal(normalizeManifestPath(path.join(outputRoot, 'assets', 'images', 'logo.svg'), outputRoot), 'assets/images/logo.svg');
  assert.equal(collectAssetManifest(outputRoot).files.includes('asset-manifest.json'), false);
  assert.equal(manifest.files.includes('asset-manifest.json'), false);
  assert.equal(manifest.files.includes('old.js'), false);
  assert.equal(manifest.directories.includes('old'), false);
});

test('deepMerge unions files and directories from remote and local manifests', async () => {
  const { deepMerge } = await import('../proxy/proxy-utils.mjs');

  const targetManifest = {
    files: ['assets/landingpage/icon1.svg', 'assets/landingpage/search.svg'],
    directories: ['assets/landingpage'],
  };
  const localManifest = {
    files: ['main.js', 'styles.css'],
    directories: ['assets'],
  };

  const merged = deepMerge(targetManifest, localManifest);

  assert.deepEqual(merged.files, [
    'assets/landingpage/icon1.svg',
    'assets/landingpage/search.svg',
    'main.js',
    'styles.css',
  ]);
  assert.deepEqual(merged.directories, ['assets/landingpage', 'assets']);
});

test('writeAssetManifest throws when output directory is missing', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-manifest-missing-'));
  const missingRoot = path.join(tempRoot, 'missing-output');

  assert.throws(() => writeAssetManifest(missingRoot), /missing-output/);
});
