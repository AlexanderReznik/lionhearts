# Lionhearts Volleyball Club Website — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 7-page static Astro website for London Lionhearts Volleyball Club with dark-navy design, electric blue accents, Google Sheets session data, Volleyzone deep links, Behold.so Instagram embed, Netlify Forms, and full SEO with sitemap and JSON-LD structured data.

**Architecture:** Astro 5 static site — all pages pre-rendered at build time, zero JS by default. Shared components in `src/components/`, data utilities in `src/lib/`, static data in `src/data/`. Google Sheets CSV fetched at build time. No CMS in Phase 1.

**Tech Stack:** Astro 5, vanilla CSS (custom properties), `@astrojs/sitemap`, Vitest, Netlify Forms (or Formspree), Behold.so (Instagram embed)

**Visual reference:** All 7 pages are mocked up in `.superpowers/brainstorm/*/content/mockup-final.html`

**Spec:** `docs/superpowers/specs/2026-05-22-lionhearts-website-design.md`

---

## Git Strategy

- `git init` at project root before Task 1
- Commit at the end of every task (message format: `feat: <component>` / `chore: setup`)
- Push to GitHub remote once created — all subsequent commits push automatically

---

## Sub-Plans (expand each before implementing)

| # | Sub-plan | File | Contents |
|---|----------|------|----------|
| 1 | Project Setup | `plans/lionhearts/01-project-setup.md` | Scaffold, config, CSS design system, data layer, BaseHead, BaseLayout |
| 2 | Shared Components | `plans/lionhearts/02-shared-components.md` | Nav, Footer |
| 3 | Homepage | `plans/lionhearts/03-homepage.md` | Hero, StatsBar, AboutIntro, CommunitySection, JoinCTA, SponsorsSection, InstagramFeed, page assembly |
| 4 | About Page | `plans/lionhearts/04-about.md` | Page hero, two-column history, values row |
| 5 | Events Page | `plans/lionhearts/05-events.md` | Google Sheets sessions, filter pills, Volleyzone team sections, structured data (Event+Schedule) |
| 6 | Teams Page | `plans/lionhearts/06-teams.md` | 9-team grid, team data, TeamCard component |
| 7 | Sponsorship Page | `plans/lionhearts/07-sponsorship.md` | Title sponsor, Become a Sponsor banner, perks grid |
| 8 | Join Us Page | `plans/lionhearts/08-join.md` | Three pathways, Netlify Form, SportsOrganization JSON-LD |
| 9 | Contact Page | `plans/lionhearts/09-contact.md` | Contact cards, location block, social row |
| 10 | SEO & Deploy | `plans/lionhearts/10-seo-deploy.md` | robots.txt, sitemap verification, OG image, Netlify config, smoke test |

---

## File Map

```
/Users/alex/projects/lionhearts/
├── .gitignore
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── netlify.toml                        ← Netlify build config + form handling
├── public/
│   ├── robots.txt
│   └── images/
│       ├── og-default.jpg              ← 1200×630 branded OG fallback (create placeholder)
│       └── placeholder-hero.jpg        ← dark navy gradient placeholder for carousel
├── src/
│   ├── env.d.ts
│   ├── styles/
│   │   └── global.css                  ← CSS custom properties + reset + utility classes
│   ├── lib/
│   │   └── sheets.ts                   ← CSV parser + fetchSessions()
│   ├── data/
│   │   ├── teams.ts                    ← 9 team definitions (name, gender, division, badge)
│   │   └── flags.ts                    ← placeholder flag emojis for community section
│   ├── components/
│   │   ├── BaseHead.astro              ← <head>: title, meta, canonical, OG, Twitter, JSON-LD
│   │   ├── Nav.astro                   ← sticky glassmorphism nav
│   │   ├── Footer.astro                ← footer with links, address, socials
│   │   ├── Hero.astro                  ← full-screen photo carousel
│   │   ├── StatsBar.astro              ← full-width blue gradient stats strip
│   │   ├── AboutIntro.astro            ← two-column about section
│   │   ├── CommunitySection.astro      ← flag mosaic + quote
│   │   ├── JoinCTA.astro               ← join CTA banner
│   │   ├── SponsorsSection.astro       ← title sponsor card
│   │   ├── InstagramFeed.astro         ← Behold.so embed
│   │   └── TeamCard.astro              ← individual team card
│   ├── layouts/
│   │   └── BaseLayout.astro            ← wraps Nav + Footer + BaseHead
│   └── pages/
│       ├── index.astro                 ← homepage
│       ├── about.astro
│       ├── events.astro
│       ├── teams.astro
│       ├── sponsorship.astro
│       ├── join.astro
│       └── contact.astro
└── tests/
    └── sheets.test.ts                  ← Vitest unit tests for CSV parser
```

---

## Implementation Order

Implement sub-plans **in order** — each builds on the previous:

1. **Project Setup** — nothing works without this
2. **Shared Components** — Nav + Footer needed by every page
3. **Homepage** — most complex page; validates the design system works end-to-end
4. **About** → **Events** → **Teams** → **Sponsorship** → **Join Us** → **Contact** — inner pages, each self-contained
5. **SEO & Deploy** — final pass, Netlify config, smoke test

Sub-plans 4–9 can be implemented by separate agents in parallel once sub-plan 3 is done (they share no state beyond the layout and components).
