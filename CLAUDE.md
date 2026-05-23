# Lionhearts Volleyball — Claude Code Notes

## Working Directory

All work happens in `/Users/alex/projects/lionhearts`.

## Git Commands

Run git commands from the project root — do NOT use `git -C <path>`. The working directory is already set correctly between shell calls.

```bash
# WRONG
git -C /Users/alex/projects/lionhearts add src/foo.ts

# RIGHT
git add src/foo.ts
git commit -m "feat: ..."
```

## Project Stack

- Astro 6 (static site)
- TypeScript strict
- Vitest for unit tests
- `@astrojs/sitemap` integration
- No framework (vanilla Astro components)

## Design System

Dark navy theme. All CSS tokens live in `src/styles/global.css`.
Key colours: `--color-bg: #050d1a`, accent gradient `#0050e0 → #0090ff`.
