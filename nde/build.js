const fs = require('fs');
const path = require('path');
const readline = require('readline');


const projectRoot = path.resolve(__dirname, '..');
const lockFile = path.join(projectRoot, 'building.lock');

const { execSync } = require('child_process');

// Read auto-discovery settings from package.json `nde` config so each
// plugin (components / interceptors / events) can be toggled and pointed
// at a custom directory without editing this file.
const ndeConfig =
  (JSON.parse(fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8"))
    .nde) || {};




function askUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}


async function main() {
  // ---- LOCK HANDLING ----
  if (fs.existsSync(lockFile)) {
    console.log(`Lock detected: ${lockFile}`);

    if (!process.stdin.isTTY) {
      console.log('Non-interactive mode → skipping regeneration.');
      return;
    }

    const answer = await askUser('Remove lock file? (y/N): ');

    if (answer === 'y' || answer === 'yes') {
      fs.unlinkSync(lockFile);
      console.log('Lock removed.');
    } else {
      console.log('Skipping build due to lock.');
      return;
    }
  }

  fs.writeFileSync(lockFile, 'locked');

  try {
    // ---- REST OF YOUR BUILD PROCESS ----
    runBuildSteps();
  } finally {
    // always clean up lock
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
  }
}




main().catch(err => {
  console.error(err);
  process.exit(1);
});




function normalizeEnv(value) {
  if (!value) return undefined;

  const v = value.toString().trim().toLowerCase();

  if (v === "undefined" || v === "null" || v === "") {
    return undefined;
  }

  return value;
}


function runBuildSteps() {

  if (process.argv[2]) {
    process.env.BUILD_TARGET = process.argv[2];
    process.env.npm_config_env = process.argv[2];
  }

  const env =
    normalizeEnv(process.env.npm_config_env) ||
    normalizeEnv(process.env.BUILD_TARGET);

  const selectedEnv = process.env.BUILD_TARGET || ndeConfig["defaultEnvironment"]; 
  if (!env) {
    console.error('❌ Missing env (e.g. central, kuleuven, luca, vlp, lirias,  ...)');
    process.exit(1);
  }

  console.log(` 🚀 Starting build for env: ${env}`);

  process.env.BUILD_TARGET = env;


  // run prebuild manually
  execSync(`node nde/prebuild.js`, {
    stdio: 'inherit',
    env: process.env
  });

  // forward to Angular CLI
  execSync(`ng build`, {
    stdio: 'inherit',
    env: process.env
  });

  // run postbuild manually
  execSync(`node nde/postbuild.js`, {
    stdio: 'inherit',
    env: process.env
  });

}