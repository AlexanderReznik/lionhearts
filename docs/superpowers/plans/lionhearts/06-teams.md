# Sub-Plan 06 — Meet Our Teams Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task.

**Goal:** Build `/teams` — 9-team grid using the `teams` data array and a `TeamCard` component.

**Visual reference:** `mockup-final.html` → Teams tab.

**Prerequisite:** Sub-plans 01–03 complete. `src/data/teams.ts` exists.

---

### Task 1: TeamCard component

**Files:**
- Create: `src/components/TeamCard.astro`

- [ ] **Step 1: Create TeamCard.astro**

```astro
---
// src/components/TeamCard.astro
import type { Team } from '../data/teams';

interface Props {
  team: Team;
}

const { team } = Astro.props;
const imagePath = team.image ?? '/images/team-placeholder.jpg';
---

<article class="team-card">
  <div class="team-card__photo">
    <img
      src={imagePath}
      alt={`${team.name} team photo`}
      loading="lazy"
      onerror="this.style.display='none'"
    />
    <div class="team-card__photo-fallback" aria-hidden="true">Team photo</div>
  </div>
  <div class="team-card__info">
    <span class="team-card__gender">{team.gender}</span>
    <h2 class="team-card__name">{team.name}</h2>
    <p class="team-card__division">{team.division}</p>
    {team.badge && <span class="team-card__badge">{team.badge}</span>}
  </div>
</article>

<style>
  .team-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--color-border);
    border-radius: 14px;
    overflow: hidden;
    transition: border-color 0.2s, transform 0.2s;
  }

  .team-card:hover {
    border-color: rgba(0,120,255,0.3);
    transform: translateY(-2px);
  }

  .team-card__photo {
    aspect-ratio: 16 / 9;
    background: linear-gradient(160deg, var(--color-surface-2), var(--color-surface));
    border-bottom: 1px solid var(--color-border);
    position: relative;
    overflow: hidden;
  }

  .team-card__photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .team-card__photo-fallback {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-faint);
    font-size: 0.625rem;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .team-card__info { padding: 18px 20px; }

  .team-card__gender {
    font-size: 0.5rem;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--color-highlight-1);
    display: block;
    margin-bottom: 6px;
  }

  .team-card__name {
    font-size: 1.25rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }

  .team-card__division {
    font-size: 0.6875rem;
    color: var(--color-text-muted);
    margin-bottom: 10px;
  }

  .team-card__badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: linear-gradient(90deg, var(--color-accent-from), var(--color-accent-to));
    border-radius: 3px;
    padding: 3px 10px;
    font-size: 0.5rem;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TeamCard.astro
git commit -m "feat: add TeamCard component"
```

---

### Task 2: Teams page

**Files:**
- Create: `src/pages/teams.astro`

- [ ] **Step 1: Create teams.astro**

```astro
---
// src/pages/teams.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import TeamCard from '../components/TeamCard.astro';
import { teams } from '../data/teams';

const womensTeams = teams.filter(t => t.gender === "Women's");
const mensTeams   = teams.filter(t => t.gender === "Men's");
---

<BaseLayout
  title="Our Teams · London Lionhearts VBC"
  description="9 teams competing across the NVL Super League and LVA — Women's: Vinarius, Cats, Fury, Beats. Men's: Alpha, Predators, Pride, Roar, Leo. East London's most competitive volleyball club."
>
  <div class="page-hero">
    <p class="page-hero__eyebrow">9 Teams · NVL & LVA</p>
    <h1 class="page-hero__title">Meet Our<br /><em>Teams</em></h1>
    <p class="page-hero__sub">
      From the NVL Super League to Division 4 — 9 competitive teams, one club identity.
    </p>
  </div>

  <div class="page-content">

    <p class="eyebrow" style="margin-bottom: 1.5rem;">Women's Teams</p>
    <div class="teams-grid" style="margin-bottom: 2.5rem;">
      {womensTeams.map(team => <TeamCard team={team} />)}
    </div>

    <p class="eyebrow" style="margin-bottom: 1.5rem;">Men's Teams</p>
    <div class="teams-grid">
      {mensTeams.map(team => <TeamCard team={team} />)}
    </div>

    <p class="teams-note">
      * Divisions are placeholders — confirm with club before launch.
      Team photos to be provided by client.
    </p>

  </div>
</BaseLayout>

<style>
  .teams-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .teams-note {
    font-size: 0.625rem;
    color: rgba(255,255,255,0.2);
    margin-top: 20px;
  }
</style>
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Navigate to `http://localhost:4321/teams`:
- [ ] Women's section: 4 cards (Vinarius, Cats, Fury, Beats)
- [ ] Men's section: 5 cards (Alpha, Predators, Pride, Roar, Leo)
- [ ] Vinarius and Alpha show ⚡ Super League badge
- [ ] Photo placeholder fallback text shows for all

- [ ] **Step 3: Build check + commit**

```bash
npm run build
git add src/components/TeamCard.astro src/pages/teams.astro
git commit -m "feat: add Teams page with 9-team grid and TeamCard component"
```

---

### ✅ Sub-plan 06 complete

**Next:** `plans/lionhearts/07-sponsorship.md`
