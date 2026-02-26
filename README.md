# Felipe's Custom Skills

Repositório central para organização e sincronização de skills customizadas para o Antigravity.

## � Instalação Rápida

Se você acabou de clonar este repositório, instale o comando `skills` globalmente (via link local) para facilitar o uso:

```bash
npm link
```
*Agora você pode usar apenas `skills sync` em vez de `npx skills sync`.*

Ou use diretamente via npx:
```bash
npx skills sync
```

## 📂 Organização Atual

As skills estão organizadas por categorias para facilitar a manutenção:

```text
skills/
├── mobile/             # Android, Kotlin, Gradle
├── web/                # React, SEO, Performance
├── quality-assurance/  # Audits e Testes
├── other/              # Melhores práticas e Geral
└── bin/
    └── cli.js          # CLI de Gerenciamento
```

## 🛠️ Comandos da CLI

| Comando | Descrição |
| :--- | :--- |
| `skills list` | Lista todas as skills locais e as instaladas. |
| `skills sync` | Sincroniza todas as skills locais para o Antigravity. |
| `skills add <path>` | Adiciona uma skill específica (ex: `skills add mobile/android-expert`). |
| `skills add <url>` | Instala uma skill diretamente de um repositório GitHub. |
| `skills remove <nome>` | Remove uma skill instalada. |

## � Como Adicionar uma Skill

1. Crie uma pasta na categoria adequada (ou crie uma nova categoria).
2. Adicione um arquivo `SKILL.md`.
3. Execute `skills sync`.
