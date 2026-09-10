# icon-generator-skill

Agent skill for generating Android and iOS app icon sets from a single source image.

## What it does

- Exports Android launcher icons across common `mipmap-*` sizes
- Exports iOS `AppIcon.appiconset` PNGs plus `Contents.json`
- Optionally exports Android adaptive icon foreground/background/XML assets
- Supports `contain` and `cover` fitting modes
- Supports custom padding color, extra square sizes, and rounded corners

## Install With `npx skills`

This repository is structured as a root-level skill repository, so it can be installed directly with the open skills CLI:

```bash
npx skills add anhao/icon-generator-skill
```

Examples:

```bash
# Install globally for detected agents
npx skills add anhao/icon-generator-skill -g

# Install only for Codex
npx skills add anhao/icon-generator-skill -g -a codex

# Install only for Claude Code
npx skills add anhao/icon-generator-skill -g -a claude-code

# List available skills in this repo
npx skills add anhao/icon-generator-skill --list
```

The `vercel-labs/skills` CLI discovers skills from a repository root when that root contains `SKILL.md`, which is how this repository is organized.

## Repository Layout

Main files:

- `SKILL.md`: skill trigger and workflow instructions
- `scripts/icon_generator.py`: bundled export script
- `references/usage.md`: argument and output reference

## Dependency

```bash
python3 -m pip install 'Pillow>=10.0.0'
```

## Direct Script Usage

Basic export:

```bash
python3 scripts/icon_generator.py input.png -o output_icons
```

Export with crop, rounded corners, and extra sizes:

```bash
python3 scripts/icon_generator.py input.png \
  -o output_icons \
  --mode cover \
  --background '#FFFFFFFF' \
  --extra-sizes 256 384 \
  --corner-radius 18
```

Export Android adaptive icons:

```bash
python3 scripts/icon_generator.py input.png \
  -o output_icons \
  --android-adaptive \
  --adaptive-background '#FFFFFF'
```

## Manual Install

If you want to install it manually instead of using `npx skills`, place this repository in an agent skill directory and keep the skill folder name aligned with the skill trigger `$icon-generator`.

## License

MIT
