#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const command = args[0];
const skillsDir = path.join(os.homedir(), '.gemini', 'antigravity', 'skills');
const repoDir = path.join(__dirname, '..');

/**
 * Recursively finds all directories containing a SKILL.md file.
 * Returns relative paths from repoDir.
 */
function getLocalSkills(dir = repoDir) {
  let results = [];
  const list = fs.readdirSync(dir);

  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (['bin', '.git', 'node_modules'].includes(item)) continue;

      // Check if this directory has a SKILL.md
      if (fs.existsSync(path.join(fullPath, 'SKILL.md'))) {
        results.push(path.relative(repoDir, fullPath));
      }

      // Continue searching deeper
      results = results.concat(getLocalSkills(fullPath));
    }
  }
  return results;
}

function installSkill(skillPath) {
  // Use the full relative path as the name to preserve structure if desired,
  // or just the basename. Let's use the full relative path to allow categories.
  const name = skillPath;
  const sourcePath = path.join(repoDir, skillPath);
  const targetPath = path.join(skillsDir, name);

  if (fs.existsSync(targetPath)) {
    console.log(`Skipping: Skill '${name}' already exists.`);
    return;
  }

  const targetParent = path.dirname(targetPath);
  if (!fs.existsSync(targetParent)) {
    fs.mkdirSync(targetParent, { recursive: true });
  }

  fs.cpSync(sourcePath, targetPath, { recursive: true });
  console.log(`✅ Skill '${name}' installed!`);
}

if (!command || command === 'help') {
  console.log('Usage:');
  console.log('  npx skills sync                - Installs all local skills (recursive search)');
  console.log('  npx skills add <path>          - Installs a specific local skill by path');
  console.log('  npx skills add <url> [--skill <name>] - Installs from GitHub');
  console.log('  npx skills remove <name>       - Removes an installed skill');
  console.log('  npx skills list                - Lists local and installed skills');
  process.exit(0);
}

if (command === 'list') {
  console.log('\nAvailable in local repo:');
  const local = getLocalSkills();
  if (local.length === 0) console.log(' None.');
  local.forEach(s => console.log(` - ${s}`));

  console.log('\nCurrently installed in Antigravity:');
  if (fs.existsSync(skillsDir)) {
    const installed = [];
    function walkInstalled(dir, base = '') {
      const files = fs.readdirSync(dir);
      for (const f of files) {
        const full = path.join(dir, f);
        const rel = path.join(base, f);
        if (fs.statSync(full).isDirectory()) {
          if (fs.existsSync(path.join(full, 'SKILL.md'))) {
            installed.push(rel);
          }
          walkInstalled(full, rel);
        }
      }
    }
    walkInstalled(skillsDir);
    if (installed.length === 0) console.log(' None.');
    installed.forEach(s => console.log(` - ${s}`));
  } else {
    console.log(' None.');
  }
  process.exit(0);
}

if (command === 'sync' || command === 'install') {
  console.log('Installing all local skills...');
  const skills = getLocalSkills();
  skills.forEach(s => installSkill(s));
  console.log('\nDone! Restart the agent to see changes.');
  process.exit(0);
}

if (command === 'add') {
  let targetSkill = args[1];
  if (!targetSkill) {
    console.error('Error: No skill path or URL provided.');
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

      const finalTarget = path.join(skillsDir, skillToInstall);
      if (!fs.existsSync(path.dirname(finalTarget))) {
        fs.mkdirSync(path.dirname(finalTarget), { recursive: true });
      }

      fs.cpSync(sourcePath, finalTarget, { recursive: true });
      console.log(`✅ Skill '${skillToInstall}' installed!`);
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  } else {
    // Local installation
    const sourcePath = path.join(repoDir, targetSkill);
    if (!fs.existsSync(sourcePath)) {
      console.error(`Error: Skill path '${targetSkill}' not found in local repo.`);
      process.exit(1);
    }
    if (!fs.existsSync(path.join(sourcePath, 'SKILL.md'))) {
      console.error(`Error: Path '${targetSkill}' does not contain a SKILL.md file.`);
      process.exit(1);
    }
    installSkill(targetSkill);
  }
  process.exit(0);
}

if (command === 'remove') {
  const skillName = args[1];
  if (!skillName) {
    console.error('Error: No skill name provided.');
    process.exit(1);
  }
  const targetPath = path.join(skillsDir, skillName);
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
    console.log(`🗑️ Skill '${skillName}' removed.`);
  } else {
    console.log(`Error: Skill '${skillName}' is not installed.`);
  }
  process.exit(0);
}

