const test = require('node:test');
const assert = require('node:assert/strict');

test('resolveCustomModuleManifestPath handles IZ manifest requests and ignores central package manifests', async () => {
  const { resolveCustomModuleManifestPath, isCustomModuleAssetManifestRequest, shouldProxyLandingPageAssetRequest } = await import('../proxy/proxy-utils.mjs');

  const manifestPath = resolveCustomModuleManifestPath('/custom/TEST_INST-TEST_VIEW/asset-manifest.json', 'dist/custom-module');
  assert.equal(manifestPath, 'dist/custom-module/asset-manifest.json');

  const centralManifestPath = resolveCustomModuleManifestPath('/custom/TEST_NZ-CENTRAL_PACKAGE/asset-manifest.json', 'dist/custom-module');
  assert.equal(centralManifestPath, null);

  assert.equal(isCustomModuleAssetManifestRequest('/custom/TEST_INST-TEST_VIEW/asset-manifest.json'), true);
  assert.equal(isCustomModuleAssetManifestRequest('/custom/TEST_NZ-CENTRAL_PACKAGE/asset-manifest.json'), false);
  assert.equal(isCustomModuleAssetManifestRequest('/custom/TEST_INST-TEST_VIEW/CENTRAL_CODE.txt'), false);
  assert.equal(isCustomModuleAssetManifestRequest('/custom/TEST_INST-TEST_VIEW/assets/example.png'), false);

  assert.equal(shouldProxyLandingPageAssetRequest('/custom/TEST_INST-TEST_VIEW/assets/landingpage/icon.svg'), true);
  assert.equal(shouldProxyLandingPageAssetRequest('/nde/custom/TEST_INST-TEST_VIEW/assets/landingpage/search.svg'), true);
  assert.equal(shouldProxyLandingPageAssetRequest('/custom/TEST_INST-TEST_VIEW/assets/homepage/homepage.css'), true);
  assert.equal(shouldProxyLandingPageAssetRequest('/nde/custom/TEST_INST-TEST_VIEW/assets/homepage/homepage_de.html'), true);
  assert.equal(shouldProxyLandingPageAssetRequest('/custom/TEST_INST-TEST_VIEW/assets/main.js'), false);
});

test('createMergedAssetManifest merges dynamic IZ proxy sources and derives directories from files', async () => {
  const { createMergedAssetManifest, normalizeManifestPath, addParentDirectories } = await import('../proxy/proxy-utils.mjs');

  const manifestA = {
    files: ['assets/css/custom.css', 'assets/images/a.svg'],
    directories: ['assets', 'assets/css', 'assets/images']
  };

  const manifestB = {
    files: ['assets/css/custom.css', 'assets/images/b.svg'],
    directories: ['assets', 'assets/css', 'assets/images']
  };

  const merged = createMergedAssetManifest([manifestA, manifestB]);

  assert.deepEqual(merged.files, ['assets/css/custom.css', 'assets/images/a.svg', 'assets/images/b.svg']);
  assert.deepEqual(merged.directories, ['assets', 'assets/css', 'assets/images']);

  const filePath = 'C:\\env\\nde\\mainCustomModule\\dist\\customModule\\assets\\images\\logo.svg';
  assert.equal(normalizeManifestPath(filePath, 'C:\\env\\nde\\mainCustomModule\\dist\\customModule'), 'assets/images/logo.svg');

  const derived = addParentDirectories(['assets/images/icons/test.svg']);
  assert.deepEqual(derived, ['assets', 'assets/images', 'assets/images/icons']);
});

test('getAssetRelativePath strips the custom module asset prefix', async () => {
  const { getAssetRelativePath } = await import('../proxy/proxy-utils.mjs');

  assert.equal(getAssetRelativePath('/custom/TEST_INST-TEST_VIEW/assets/homepage/homepage_background.svg'), 'homepage/homepage_background.svg');
  assert.equal(getAssetRelativePath('/nde/custom/TEST_INST-TEST_VIEW/assets/main.js'), 'main.js');
  assert.equal(getAssetRelativePath('/nde/custom/TEST_INST-TEST_VIEW/assets/images/a.svg?v=1'), 'images/a.svg');
  assert.equal(getAssetRelativePath('/nde/custom/TEST_INST-TEST_VIEW/assets'), null);
  assert.equal(getAssetRelativePath('/nde/home'), null);
});

test('resolveLocalAssetFilePath prefers src/assets and returns null when missing', async (t) => {
  const os = require('node:os');
  const fs = require('node:fs');
  const path = require('node:path');
  const { resolveLocalAssetFilePath } = await import('../proxy/proxy-utils.mjs');

  const originalCwd = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-test-'));
  const buildRoot = path.join(tempRoot, 'dist', 'custom-module');
  try {
    fs.mkdirSync(path.join(tempRoot, 'src', 'assets', 'homepage'), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, 'src', 'assets', 'homepage', 'homepage_background.svg'), '<svg/>');
    fs.mkdirSync(path.join(buildRoot, 'assets', 'homepage'), { recursive: true });
    fs.writeFileSync(path.join(buildRoot, 'assets', 'homepage', 'built_only.svg'), '<svg/>');

    process.chdir(tempRoot);

    const srcHit = resolveLocalAssetFilePath('homepage/homepage_background.svg', buildRoot);
    assert.equal(srcHit, path.join(tempRoot, 'src', 'assets', 'homepage', 'homepage_background.svg'));

    const distHit = resolveLocalAssetFilePath('homepage/built_only.svg', buildRoot);
    assert.equal(distHit, path.join(buildRoot, 'assets', 'homepage', 'built_only.svg'));

    assert.equal(resolveLocalAssetFilePath('homepage/missing.svg', buildRoot), null);
    assert.equal(resolveLocalAssetFilePath('../secret.txt', buildRoot), null);
    assert.equal(resolveLocalAssetFilePath(null, buildRoot), null);
  } finally {
    process.chdir(originalCwd);
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
