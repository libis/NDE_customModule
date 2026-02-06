const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const packageJsonPath = path.resolve(projectRoot, 'package.json');
const bootstrapPath = path.resolve(projectRoot, 'src/bootstrap.ts');
const mainPath = path.resolve(projectRoot, 'src/main.ts');
const webpackConfigPath = path.resolve(projectRoot, 'webpack.config.js');
const assetBaseOutPath = path.resolve(projectRoot, 'src/app/state/asset-base.generated.ts');

if (!fs.existsSync(packageJsonPath)) {
    console.error("Error: package.json file not found!");
    process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const ndeConfig = packageJson.nde;

if (!ndeConfig) {
    console.error("Error: 'nde' section not found in package.json!");
    process.exit(1);
}

const addonName = ndeConfig.addonName;

if (addonName) {
    const newBootstrapPath = path.resolve(projectRoot, `src/bootstrap${addonName}.ts`);

    // Restore bootstrap.ts from previous version if needed
    if (!fs.existsSync(bootstrapPath) && fs.existsSync(newBootstrapPath)) {
        fs.copyFileSync(newBootstrapPath, bootstrapPath);
        console.log(`Restored bootstrap.ts from bootstrap${addonName}.ts`);
    }

    // Rename bootstrap.ts if not already renamed
    if (fs.existsSync(bootstrapPath) && !fs.existsSync(newBootstrapPath)) {
        fs.renameSync(bootstrapPath, newBootstrapPath);
        console.log(`Renamed bootstrap.ts to bootstrap${addonName}.ts`);
    }

    // Update main.ts import
    let mainContent = fs.readFileSync(mainPath, 'utf8');
    mainContent = mainContent.replace(
        /import\(['"]\.\/bootstrap.*?['"]\)/g,
        `import('./bootstrap${addonName}')`
    );
    fs.writeFileSync(mainPath, mainContent);
    console.log(`Updated main.ts to import('./bootstrap${addonName}')`);

    // Update webpack.config.js
    let webpackConfig = fs.readFileSync(webpackConfigPath, 'utf8');
    webpackConfig = webpackConfig.replace(/name:\s*["'][^"']+["']/, `name: "${addonName}"`);
    webpackConfig = webpackConfig.replace(/uniqueName:\s*["'][^"']+["']/, `uniqueName: "${addonName}"`);
    webpackConfig = webpackConfig.replace(/'\.\/[^']+':\s*'\.\/src\/bootstrap[^']*'/, `'./${addonName}': './src/bootstrap${addonName}.ts'`);
    fs.writeFileSync(webpackConfigPath, webpackConfig);
    console.log(`Updated webpack.config.js for addon: ${addonName}`);

} else {
    console.log("addonName not found in package.json nde section. Skipping renaming.");
}

// --- Handle ASSET_BASE_URL ---
const assetBaseUrl = ndeConfig.assetBaseUrl || '';

console.log('NDE config:', ndeConfig);
console.log('Extracted assetBaseUrl:', assetBaseUrl);

fs.writeFileSync(assetBaseOutPath, `export const assetBaseUrl = '${assetBaseUrl}';\n`);
console.log(`✔ Written to ${assetBaseOutPath}:\nexport const assetBaseUrl = '${assetBaseUrl}';`);

console.log('Prebuild completed successfully!');
/*

 The script reads the package.json file and extracts the ADDON_NAME and ASSET_BASE_URL values from the nde section.
 It then renames the bootstrap.ts file to bootstrap{ADDON_NAME}.ts and updates the main.ts file to import the renamed bootstrap file.
 It also updates the webpack.config.js file with the addon name and the new bootstrap file.
 Finally, it writes the assetBaseUrl value to a new file asset-base.generated.ts.
*/
