const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
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

const distPath = path.join(__dirname, 'dist', 'custom-module');
const targetPath = path.join(__dirname, 'dist', `${envConfig.institution}-${envConfig.view}`);
const zipPath = path.join(__dirname, 'dist', `${envConfig.institution}-${envConfig.view}.zip`);

function removeDirectory(directory, callback) {
    fs.rm(directory, { recursive: true, force: true }, callback);
}

function renameAndArchive() {
    fs.rename(distPath, targetPath, (err) => {
        if (err) throw err;
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
