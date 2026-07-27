// nde/build.js
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const {
  projectRoot,
  resolveEnv,
} = require('./env.cjs');

const lockFile = path.join(projectRoot, 'building.lock');

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
    runBuildSteps();
  } finally {
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
  }
}

function runBuildSteps() {
  const explicitEnv = process.argv[2];
  const {
    selectedEnv,
    generatedTsconfigPath,
  } = resolveEnv(explicitEnv);

  process.env.BUILD_TARGET = selectedEnv;
  process.env.npm_config_env = selectedEnv;

  console.log(`🚀 Starting isolated build for env: ${selectedEnv}`);

  execSync(`node nde/prebuild.js ${selectedEnv}`, {
    stdio: 'inherit',
    env: process.env
  });

  execSync(`ng build --ts-config "${generatedTsconfigPath}"`, {
    stdio: 'inherit',
    env: process.env
  });

/*
  execSync(`ng build`, {
    stdio: 'inherit',
    env: process.env
  });
*/

  execSync(`node nde/postbuild.js`, {
    stdio: 'inherit',
    env: process.env
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});