const fs = require('fs');
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
    console.error(`Error: Environment '${defaultEnv}' not found in package.json nde.environments!`);
    process.exit(1);
}

const distPath = path.join(projectRoot, 'dist', 'custom-module');
const targetPath = path.join(projectRoot, 'dist', `${envConfig.institution}-${envConfig.view}`);
const zipPath = path.join(projectRoot, 'dist', `${envConfig.institution}-${envConfig.view}.zip`);



const distAssetsPath = path.join(distPath, 'assets');

console.log(`👉 Postbuild for env: ${selectedEnv}`);


let sourcePath;
let sourceFile;



dirs= ["shared", "central", "views"];

console.log (`Remove folders : ${ dirs.join(', ')} from assets` );
dirs.forEach((dir, index) => {
  delPath = path.resolve(distAssetsPath, dir);
  console.log (delPath);
  removeDirectory(delPath, (err) => {
     if (err) throw err;
  });
});


// Copy assets from shared
sourcePath = path.resolve(projectRoot, 'src/assets/shared');
copyAssets(sourcePath, distAssetsPath)

// Copy CENTRAL_CODE.txt
sourceFile = path.resolve(projectRoot, 'src/assets/CENTRAL_CODE.txt');
distCentralCodeFile =  path.join(distPath, 'CENTRAL_CODE.txt');
copyAssets(sourceFile, distCentralCodeFile)



if (selectedEnv === 'central') {
  // Copy/Override assets (from shared) from central
  sourcePath = path.resolve(projectRoot, 'src/assets/central');
} else {
  // Copy/Override assets (from shared) from view/<name> 
  sourcePath = path.resolve(projectRoot, 'src/assets/views', selectedEnv);
}
copyAssets(sourcePath, distAssetsPath)

function copyAssets(sourcePath, distAssetsPath) {
  // === VALIDATE SOURCE ===
  if (!fs.existsSync(sourcePath)) {
    console.warn(`[postbuild] Source folder does not exist: ${sourcePath}`);
    process.exit(0);
  }

  try {
    fse.copySync(sourcePath, distAssetsPath, {
      overwrite: true,
      dereference: true,
      filter: (src) => {
        const fileName = path.basename(src);

        // Exclude hidden files + .gitkeep
        if (fileName.startsWith('.') || fileName === '.gitkeep') {
          return false;
        }
        return true;
      }
    });

    console.log('[postbuild] ✅ Asset override complete');
    console.log(`[postbuild] Copying override assets:`);
    console.log(`  FROM: ${sourcePath}`);
    console.log(`  TO:   ${distAssetsPath}`);

  } catch (err) {
    console.error('[postbuild] ❌ Error during copy:', err);
    process.exit(1);
  }
}


function removeDirectory(directory, callback) {
    fs.rm(directory, { recursive: true, force: true }, callback);
}


function renameAndArchive() {
    fs.rename(distPath, targetPath, (err) => {
        if (err) throw err;
        console.log(`Renamed directory from ${distPath}`);
        console.log(`Renamed directory to ${targetPath}`);

        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`Archive completed: ${archive.pointer()} total bytes`);
            console.log(`Zip file created at: ${zipPath}`);
            console.log('Please upload the zip file to Alma BO custom package section to deploy your custom module.');
        });

        archive.on('warning', (err) => {
            if (err.code === 'ENOENT') {
                console.log('Warning:', err);
            } else {
                throw err;
            }
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);
        archive.directory(targetPath, path.basename(targetPath)); // This ensures the directory itself is included
        archive.finalize();

    });
}

// Check if target directory exists and remove it if it does
if (fs.existsSync(targetPath)) {
  removeDirectory(targetPath, (err) => {
        if (err) throw err;
        renameAndArchive();
    });
} else {
    renameAndArchive();
}
