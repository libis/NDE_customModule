const fs = require('fs');
const fsp = require('fs/promises');
const fse = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

const projectRoot = path.join(__dirname, '..');
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const ndeConfig = packageJson.nde;

if (!ndeConfig) {
  console.error("Error: 'nde' section not found in package.json!");
  process.exit(1);
}

const selectedEnv = process.env.BUILD_TARGET || ndeConfig.defaultEnvironment;
const envConfig = ndeConfig.environments[selectedEnv];

if (!envConfig) {
  console.error(`Error: Environment '${selectedEnv}' not found in package.json nde.environments!`);
  process.exit(1);
}

const distPath = path.join(projectRoot, 'dist', 'custom-module');
const targetPath = path.join(projectRoot, 'dist', `${envConfig.institution}-${envConfig.view}`);
const zipPath = path.join(projectRoot, 'dist', `${envConfig.institution}-${envConfig.view}.zip`);
const distAssetsPath = path.join(distPath, 'assets');

const dirs = ['shared', 'central', 'views'];

console.log(`👉 Postbuild for env: ${selectedEnv}`);
console.log(`Remove folders: ${dirs.join(', ')} from assets`);

function copyAssets(sourcePath, targetPath) {
  if (!fs.existsSync(sourcePath)) {
    console.warn(`[postbuild] Source does not exist, skipping: ${sourcePath}`);
    return;
  }

  try {
    fse.copySync(sourcePath, targetPath, {
      overwrite: true,
      dereference: true,
      filter: (src) => {
        const fileName = path.basename(src);

        if (fileName.startsWith('.') || fileName === '.gitkeep') {
          return false;
        }

        return true;
      }
    });

    console.log('[postbuild] ✅ Asset copy complete');
    console.log(`  FROM: ${sourcePath}`);
    console.log(`  TO:   ${targetPath}`);
  } catch (err) {
    console.error('[postbuild] ❌ Error during copy:', err);
    process.exit(1);
  }
}

async function removeUnwantedDirs(dirsToRemove) {
  for (const dir of dirsToRemove) {
    const delPath = path.resolve(distAssetsPath, dir);

    console.log(`Remove folder: ${delPath}`);

    await fsp.rm(delPath, {
      recursive: true,
      force: true
    });
  }

  console.log('[postbuild] ✅ Unwanted asset folders removed');
}

async function removeTargetIfExists() {
  await fsp.rm(targetPath, {
    recursive: true,
    force: true
  });

  console.log(`[postbuild] ✅ Removed previous target if present: ${targetPath}`);
}

async function removeZipIfExists() {
  await fsp.rm(zipPath, {
    force: true
  });

  console.log(`[postbuild] ✅ Removed previous zip if present: ${zipPath}`);
}

async function renameAndArchive() {
  await fsp.rename(distPath, targetPath);

  console.log(`Renamed directory from ${distPath}`);
  console.log(`Renamed directory to   ${targetPath}`);

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    output.on('close', () => {
      console.log(`Archive completed: ${archive.pointer()} total bytes`);
      console.log(`Zip file created at: ${zipPath}`);
      console.log('Please upload the zip file to Alma BO custom package section to deploy your custom module.');
      resolve();
    });

    output.on('error', reject);

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Archive warning:', err);
      } else {
        reject(err);
      }
    });

    archive.on('error', reject);

    archive.pipe(output);

    // Includes the root folder itself in the zip
    archive.directory(targetPath, path.basename(targetPath));

    archive.finalize();
  });
}

async function run() {
  // 1. Copy shared assets
  copyAssets(
    path.resolve(projectRoot, 'src/assets/shared'),
    distAssetsPath
  );

  // 2. Copy CENTRAL_CODE.txt
  copyAssets(
    path.resolve(projectRoot, 'src/assets/CENTRAL_CODE.txt'),
    path.join(distPath, 'CENTRAL_CODE.txt')
  );

  // 3. Copy environment-specific override assets
  let sourcePath;

  if (selectedEnv === 'central') {
    sourcePath = path.resolve(projectRoot, 'src/assets/central');
  } else {
    sourcePath = path.resolve(projectRoot, 'src/assets/views', selectedEnv);
  }

  copyAssets(sourcePath, distAssetsPath);

  // 4. Remove unwanted folders from dist/custom-module/assets
  await removeUnwantedDirs(dirs);

  // 5. Remove old target folder and old zip
  await removeTargetIfExists();
  await removeZipIfExists();

  // 6. Rename dist/custom-module to env-specific folder and zip it
  await renameAndArchive();
}

run().catch((err) => {
  console.error('[postbuild] ❌ Failed:', err);
  process.exit(1);
});