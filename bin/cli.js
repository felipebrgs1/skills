#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const [, , command, skillName] = process.argv;

const skillsDir = path.join(os.homedir(), '.gemini', 'antigravity', 'skills');
const sourceDir = path.join(__dirname, '..');

if (!command) {
  console.log('Uso: npx felipe-skills [add|remove|list] <nome-da-skill>');
  process.exit(1);
}

if (command === 'list') {
  console.log('Skills disponíveis no seu repositório:');
  const items = fs.readdirSync(sourceDir);
  items.forEach(item => {
    const itemPath = path.join(sourceDir, item);
    if (fs.statSync(itemPath).isDirectory() && !['bin', '.git', 'node_modules'].includes(item)) {
      console.log(` - ${item}`);
    }
  });

  console.log('\nSkills atualmente instaladas:');
  if (fs.existsSync(skillsDir)) {
    const installed = fs.readdirSync(skillsDir);
    installed.forEach(item => {
      console.log(` - ${item}`);
    });
  } else {
    console.log(' Nenhuma.');
  }
  process.exit(0);
}

if (!skillName) {
  console.error('\nErro: nome da skill não especificado.');
  console.log('Uso correcto: npx felipe-skills add <nome-da-skill>');
  process.exit(1);
}

const targetPath = path.join(skillsDir, skillName);
const sourcePath = path.join(sourceDir, skillName);

if (command === 'add') {
  if (!fs.existsSync(sourcePath)) {
    console.error(`\nErro: Skill '${skillName}' não encontrada no seu repositório.`);
    process.exit(1);
  }

  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }

  if (fs.existsSync(targetPath)) {
    console.error(`\nAviso: A skill '${skillName}' já está instalada.`);
    process.exit(1);
  }

  // Copia os arquivos da skill
  fs.cpSync(sourcePath, targetPath, { recursive: true });
  console.log(`\n✅ Skill '${skillName}' instalada com sucesso no diretório ~/.gemini/antigravity/skills/!`);
  console.log(`O agente Antigravity/OpenCode agora tem acesso a ela.`);

} else if (command === 'remove') {
  if (!fs.existsSync(targetPath)) {
    console.error(`\nErro: A skill '${skillName}' não está instalada.`);
    process.exit(1);
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
  console.log(`\n🗑️ Skill '${skillName}' removida com sucesso!`);
  console.log(`O agente não a utilizará mais.`);
} else {
  console.log('\nComando desconhecido. Comandos válidos: add, remove, list.');
  process.exit(1);
}
