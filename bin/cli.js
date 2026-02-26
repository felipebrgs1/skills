#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');

const args = process.argv.slice(2);
const command = args[0];
const skillsDir = path.join(os.homedir(), '.gemini', 'antigravity', 'skills');
const repoDir = path.join(__dirname, '..');

function getLocalSkills(dir = repoDir) {
  let results = [];
  const list = fs.readdirSync(dir);

  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (['bin', '.git', 'node_modules'].includes(item)) continue;

      if (fs.existsSync(path.join(fullPath, 'SKILL.md'))) {
        results.push(path.relative(repoDir, fullPath));
      }

      results = results.concat(getLocalSkills(fullPath));
    }
  }
  return results;
}

function installLocalSkill(skillPath) {
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

function runSkillsCLI(additionalArgs = []) {
  const child = spawn('npx', ['skills', ...additionalArgs], {
    stdio: 'inherit',
    shell: false
  });
  child.on('exit', (code) => process.exit(code || 0));
}

if (!command || command === 'help') {
  console.log('Usage:');
  console.log('  skills sync                - Instala todas as skills locais no Antigravity');
  console.log('  skills list                - Lista skills locais e instaladas');
  console.log('  skills add <path>          - Instala uma skill local específica');
  console.log('  skills remove <name>       - Remove uma skill instalada');
  console.log('');
  console.log('  skills search <query>      - Busca skills no skills.sh (via npx skills)');
  console.log('  skills install <owner/repo> - Instala skills do GitHub via skills.sh');
  console.log('  skills install <url>       - Instala skills de URL GitHub via skills.sh');
  console.log('');
  console.log('Para comandos avançados do skills.sh, use: npx skills <comando>');
  process.exit(0);
}

if (command === 'list') {
  console.log('\n📁 Available in local repo:');
  const local = getLocalSkills();
  if (local.length === 0) console.log(' None.');
  local.forEach(s => console.log(` - ${s}`));

  console.log('\n📦 Currently installed in Antigravity:');
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
  const targetArg = args[1];

  if (targetArg) {
    if (targetArg.startsWith('http') || targetArg.includes('/')) {
      console.log('Installing from skills.sh...');
      runSkillsCLI(['add', targetArg, '-a', 'antigravity', '-g', '-y']);
    } else {
      console.log('Installing local skill...');
      const sourcePath = path.join(repoDir, targetArg);
      if (!fs.existsSync(sourcePath)) {
        console.error(`Error: Skill path '${targetArg}' not found.`);
        process.exit(1);
      }
      if (!fs.existsSync(path.join(sourcePath, 'SKILL.md'))) {
        console.error(`Error: Path '${targetArg}' does not contain SKILL.md.`);
        process.exit(1);
      }
      installLocalSkill(targetArg);
    }
  } else {
    console.log('Installing all local skills...');
    const skills = getLocalSkills();
    skills.forEach(s => installLocalSkill(s));
  }
  console.log('\nDone! Restart the agent to see changes.');
  process.exit(0);
}

if (command === 'search') {
  const query = args.slice(1).join(' ');
  if (!query) {
    console.log('Searching skills.sh interactively...');
    runSkillsCLI(['find']);
  } else {
    console.log(`Searching for: ${query}`);
    runSkillsCLI(['find', query]);
  }
  process.exit(0);
}

if (command === 'add' || command === 'install') {
  let target = args[1];
  if (!target) {
    console.error('Error: No skill path or repo provided.');
    process.exit(1);
  }

  if (target.startsWith('http') || target.includes('/')) {
    console.log(`Installing from skills.sh: ${target}`);
    const skillFlag = args.includes('--skill') ? ['--skill', args[args.indexOf('--skill') + 1]] : [];
    runSkillsCLI(['add', target, '-a', 'antigravity', '-g', '-y', ...skillFlag]);
  } else {
    const sourcePath = path.join(repoDir, target);
    if (!fs.existsSync(sourcePath)) {
      console.error(`Error: Local skill '${target}' not found.`);
      process.exit(1);
    }
    if (!fs.existsSync(path.join(sourcePath, 'SKILL.md'))) {
      console.error(`Error: Path '${target}' does not contain SKILL.md.`);
      process.exit(1);
    }
    installLocalSkill(target);
  }
  process.exit(0);
}

if (command === 'remove' || command === 'rm') {
  const skillName = args[1];
  if (!skillName) {
    console.error('Error: No skill name provided.');
    process.exit(1);
  }
  const targetPath = path.join(skillsDir, skillName);
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, true: true });
    console.log(`🗑️ Skill '${skillName}' removed.`);
  } else {
    runSkillsCLI(['remove', skillName, '-a', 'antigravity', '-g', '-y']);
  }
  process.exit(0);
}

console.log(`Unknown command: ${command}`);
console.log('Run "skills help" for usage information.');
process.exit(1);
