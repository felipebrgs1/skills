#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const { execSync } = require('child_process');

const args = process.argv.slice(2);
const command = args[0];
const skillsDir = path.join(os.homedir(), '.gemini', 'antigravity', 'skills');
const repoDir = path.join(__dirname, '..');

function getLocalSkills() {
  return fs.readdirSync(repoDir).filter(item => {
    const itemPath = path.join(repoDir, item);
    return fs.statSync(itemPath).isDirectory() && !['bin', '.git', 'node_modules'].includes(item);
  });
}

function installSkill(name, sourcePath) {
  const targetPath = path.join(skillsDir, name);
  if (fs.existsSync(targetPath)) {
    console.log(`Skipping: Skill '${name}' already exists.`);
    return;
  }
  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }
  fs.cpSync(sourcePath, targetPath, { recursive: true });
  console.log(`✅ Skill '${name}' installed!`);
}

if (!command || command === 'help') {
  console.log('Usage:');
  console.log('  npx skills sync                - Installs all local skills from this repo');
  console.log('  npx skills add <folder>        - Installs a specific local skill');
  console.log('  npx skills add <url> [--skill <name>] - Installs from GitHub');
  console.log('  npx skills remove <name>       - Removes an installed skill');
  console.log('  npx skills list                - Lists local and installed skills');
  process.exit(0);
}

if (command === 'list') {
  console.log('\nAvailable in local repo:');
  getLocalSkills().forEach(s => console.log(` - ${s}`));

  console.log('\nCurrently installed in Antigravity:');
  if (fs.existsSync(skillsDir)) {
    fs.readdirSync(skillsDir).forEach(s => console.log(` - ${s}`));
  } else {
    console.log(' None.');
  }
  process.exit(0);
}

if (command === 'sync' || command === 'install') {
  console.log('Installing all local skills...');
  const skills = getLocalSkills();
  skills.forEach(s => installSkill(s, path.join(repoDir, s)));
  console.log('\nDone! Restart the agent to see changes.');
  process.exit(0);
}

if (command === 'add') {
  let targetSkill = args[1];
  if (!targetSkill) {
    console.error('Error: No skill or URL provided.');
    process.exit(1);
  }

  // Check for --skill flag
  const skillFlagIndex = args.indexOf('--skill');
  const specificSkill = skillFlagIndex !== -1 ? args[skillFlagIndex + 1] : null;

  if (targetSkill.startsWith('http')) {
    const tempDir = path.join(os.tmpdir(), `skill-dl-${Date.now()}`);
    console.log(`Cloning from ${targetSkill}...`);
    try {
      execSync(`git clone --depth 1 ${targetSkill} ${tempDir}`, { stdio: 'inherit' });

      const skillToInstall = specificSkill || path.basename(targetSkill).replace('.git', '');
      const sourcePath = specificSkill ? path.join(tempDir, specificSkill) : tempDir;

      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Skill '${specificSkill}' not found in the repository.`);
      }

      installSkill(skillToInstall, sourcePath);
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  } else {
    // Local installation
    const sourcePath = path.join(repoDir, targetSkill);
    if (!fs.existsSync(sourcePath)) {
      console.error(`Error: Skill '${targetSkill}' not found in local repo.`);
      process.exit(1);
    }
    installSkill(targetSkill, sourcePath);
  }
  process.exit(0);
}

if (command === 'remove') {
  const skillName = args[1];
  const targetPath = path.join(skillsDir, skillName);
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
    console.log(`🗑️ Skill '${skillName}' removed.`);
  } else {
    console.log(`Error: Skill '${skillName}' is not installed.`);
  }
  process.exit(0);
}

