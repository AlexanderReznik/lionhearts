# Brand Phase 3-B — Dual-Style Section Mapping (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the brand's two moods across the site — navy **feature** for competitive content and light-blue `#54a4f7` **community** for welcoming/sessions content — by refining the Phase-1 `.section--*` primitives (so feature separates in dark) and mapping them onto the right sections.

**Architecture:** Each tone is defined once in `src/styles/global.css` (`.section--feature`, `.section--community`). Components opt in by adding the tone class to a root/column/card element and pointing their internal colours at the semantic tokens (`--color-text`, `--color-text-muted`), so the tone drives them. Community = `#54a4f7` with white headings + navy body (AA-safe); feature = navy (light) / deep navy `#05122b` + hairline borders (dark).

**Tech Stack:** Astro 6 (static), scoped + global component CSS, CSS custom properties, Chrome DevTools MCP for visual + AA verification.

**Spec:** `docs/superpowers/specs/2026-06-06-brand-phase-3b-section-mapping-design.md`

**Conventions:** No inline `style=`. External links keep `rel="noopener noreferrer"`. Preserve heading hierarchy. Run git from project root (no `git -C`). Branch: `brand-phase-3b-section-mapping`. **Gotcha:** in `<style is:global>` blocks / `set:html` content (e.g. `events.astro`), use plain `html[data-theme="dark"] .x` selectors, NOT `:global(...)`.

**Baseline:** On the branch, confirm `npm run build`, `npx astro check` (2 known pre-existing errors), `npm test` (56) green. Dev server: `npm run dev` → http://localhost:4321/. Note the dev server may resolve the OS theme on load (this machine = dark); to test a specific theme, toggle the pill or set `document.documentElement.setAttribute('data-theme','light'|'dark')` via DevTools.

**Verification model:** CSS/markup — no new unit tests. Each task verifies via `npm run build` + Chrome DevTools MCP screenshots in **both** themes. Final task runs the AA sweep.

---

### Task 1: Refine the tone primitives

**Files:**
- Modify: `src/styles/global.css` (the `.section--*` block at end of file ~lines 284-304; and the `@media (prefers-color-scheme: dark)` block)

- [ ] **Step 1: Replace the `.section--*` block**

Replace the existing block (the `/* ── Section tones ── */` comment through the last `.eyebrow::before` rule, ~lines 284-304) with:

```css
/* ── Section tones (brand "moods") ──
   neutral/alt flip with the theme; feature/community are brand surfaces.
   feature: navy (light) / deep navy (dark, separates from the navy page).
   community: vivid #54a4f7 in both themes — white headings + navy body (AA). */
.section { background: var(--color-bg); color: var(--color-text); }
.section--alt { background: var(--color-bg-alt); color: var(--color-text); }

.section--feature {
  background: var(--lh-navy);
  color: var(--lh-white);
  --color-text: var(--lh-white);
  --color-text-muted: var(--lh-slate-200);
}
[data-theme="dark"] .section--feature {
  background: var(--lh-navy-deep);
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.section--community {
  background: var(--lh-blue);
  color: var(--lh-navy);
  --color-text: var(--lh-navy);
  --color-text-muted: var(--lh-navy);
}
.section--community :is(h1, h2, h3) { color: var(--lh-white); }
.section--community .btn--primary { background: var(--lh-white); color: var(--lh-navy); }

/* eyebrow: white on feature (navy), navy on community (#54a4f7, AA for small text) */
.section--feature .eyebrow { color: var(--lh-white); }
.section--feature .eyebrow::before { background: var(--lh-white); }
.section--community .eyebrow { color: var(--lh-navy); }
.section--community .eyebrow::before { background: var(--lh-navy); }
```

- [ ] **Step 2: Mirror the feature dark variant in the no-JS block**

Find the `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` block. Immediately AFTER the `:root:not([data-theme="light"]) { … }` rule's closing `}` (but still INSIDE the `@media`), add:

```css
  :root:not([data-theme="light"]) .section--feature {
    background: var(--lh-navy-deep);
    border-top: 1px solid rgba(255, 255, 255, 0.07);
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }
```

- [ ] **Step 3: Verify build**

Run: `npm run build` → success. (No section uses these classes yet; this just refines the primitives.)

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(tones): refine feature (dark deep-navy) + community (A: white head/navy body) primitives"
```

---

### Task 2: SessionsStrip → community

**Files:**
- Modify: `src/components/SessionsStrip.astro` (root class + CSS)

- [ ] **Step 1: Add the community class to the root**

In the markup, the root is `<aside class="sessions-strip" aria-label="Weekly open sessions">`. Change it to:
```astro
<aside class="sessions-strip section--community" aria-label="Weekly open sessions">
```

- [ ] **Step 2: Drop the explicit navy bg and retoken text**

In `<style>`, replace the `.sessions-strip` rule:
```css
  .sessions-strip {
    border-top: 1px solid color-mix(in srgb, var(--lh-navy) 18%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--lh-navy) 18%, transparent);
  }
```
(Background now comes from `.section--community` = `#54a4f7`; borders are navy-tint for definition.)

Retoken text colours (navy body on the blue surface):
- `.sessions-strip__lead-text strong` `color: #fff;` → `color: var(--lh-navy);`
- `.sessions-strip__lead-text span` already `var(--color-text-muted)` → now resolves to navy (community). Leave.
- `.sessions-strip__item` `border-left: 1px solid rgba(255, 255, 255, 0.08);` → `border-left: 1px solid rgba(17, 35, 75, 0.15);`
- `.sessions-strip__day` `color: var(--color-highlight-1);` → `color: var(--lh-navy);`
- `.sessions-strip__time` `color: #fff;` → `color: var(--lh-navy);`
- `.sessions-strip__level` already `var(--color-text-muted)` → navy. Leave.
- `.sessions-strip__link` (the "Full schedule →"): it uses `color: var(--color-accent-to)` — change to `color: var(--lh-navy);` and make it `font-weight: 800` (already) so it reads as a strong navy link.
- The green dot `.sessions-strip__dot` stays `var(--lh-green)` (decorative).
- Any `rgba(255,255,255,...)` left in the responsive blocks (e.g. `.sessions-strip__item` mobile border-top) → `rgba(17,35,75,0.12)`.

- [ ] **Step 3: Verify build + render in both themes**

Run: `npm run build` → success.
Chrome DevTools MCP: load `/`, set `data-theme="light"` then `"dark"`, screenshot the strip each time.
Expected: vivid `#54a4f7` strip with navy text in **both** themes (community is theme-fixed); green live-dot; legible.

- [ ] **Step 4: Commit**

```bash
git add src/components/SessionsStrip.astro
git commit -m "feat(tones): SessionsStrip → community (light-blue)"
```

---

### Task 3: ClubBridge → COMPETE feature / CONNECT community

**Files:**
- Modify: `src/components/ClubBridge.astro` (column classes + CSS)

- [ ] **Step 1: Add tone classes to the two columns**

In the markup:
- `<div class="bridge__col bridge__col--compete">` → `<div class="bridge__col bridge__col--compete section--feature">`
- `<div class="bridge__col bridge__col--connect">` → `<div class="bridge__col bridge__col--connect section--community">`

- [ ] **Step 2: Remove explicit backgrounds (tone classes provide them)**

In `<style>`:
- `.bridge__col--compete` — remove `background: var(--lh-navy);` (keep `align-items: flex-end; text-align: right;`).
- `.bridge__col--connect` — remove `background: var(--lh-navy-deep);` (the rule may become empty; if so delete it).
- In the mobile `@media`, `.bridge__col--connect { background: var(--lh-navy-deep); border-top: 1px solid var(--color-border); }` → remove the `background` line (keep the border-top).

- [ ] **Step 3: Retoken CONNECT (community) children**

- Delete the gradient-text label rule `.bridge__col--connect .bridge__label { background: linear-gradient(...); -webkit-background-clip: text; ... }` entirely — the community primitive already makes `h2` white.
- `.bridge__col--connect .bridge__points li` `color: rgba(255, 255, 255, 0.65);` → `color: var(--lh-navy);`
- `.bridge__col--connect .bridge__link` `color: var(--lh-blue); border-color: var(--color-border-blue);` → `color: var(--lh-navy); border-color: rgba(17,35,75,0.4);`
- The shared `.bridge__points li` `color: rgba(255,255,255,0.75)` is for COMPETE (feature/navy) — leave it (white on navy, fine).
- The shared `.bridge__eyebrow` `color: rgba(255,255,255,0.55)` — this applies to BOTH columns; but `.section--community .eyebrow` only styles `.eyebrow` (the bridge uses `.bridge__eyebrow`, a different class). So add explicit per-column eyebrow colours: append
  ```css
  .bridge__col--compete .bridge__eyebrow { color: rgba(255,255,255,0.6); }
  .bridge__col--connect .bridge__eyebrow { color: var(--lh-navy); }
  ```
  and change the base `.bridge__eyebrow` to not hardcode white (set `color: inherit;` so the per-column rules win, or just rely on the two overrides — keep base but the overrides have higher specificity).
- `.bridge__link` base `color: #fff;` is for COMPETE — leave (the connect override above wins for connect).
- `.bridge__numeral` `color: rgba(255,255,255,0.04)` — it's centered over both columns; leave (faint, decorative, aria-hidden).
- `.bridge__divider` `color: rgba(255,255,255,0.25)` on `var(--color-bg)` — leave (theme surface).

- [ ] **Step 4: Verify build + render in both themes**

Run: `npm run build` → success.
Chrome DevTools MCP: load `/`, screenshot ClubBridge in light and dark.
Expected: COMPETE = navy (light) / deep-navy (dark) with white text; CONNECT = `#54a4f7` with white "Connect" heading + navy points/eyebrow/link — in both themes. The two columns clearly show the two energies.

- [ ] **Step 5: Commit**

```bash
git add src/components/ClubBridge.astro
git commit -m "feat(tones): ClubBridge COMPETE→feature, CONNECT→community"
```

---

### Task 4: JoinCTA → community

**Files:**
- Modify: `src/components/JoinCTA.astro` (inner card class + CSS)

- [ ] **Step 1: Add community to the inner card**

In the markup, change `<div class="join-cta__inner">` to `<div class="join-cta__inner section--community">`. (The outer `.join-cta` stays the neutral page band; the inner card becomes the community surface.)

- [ ] **Step 2: Drop the card's explicit surface bg + glow; retoken**

In `<style>`:
- `.join-cta__inner` — remove `background: var(--color-surface);` (community class provides `#54a4f7`). Keep the rest (radius, padding, flex, shadow). Change the shadow to navy-tinted: `box-shadow: 0 24px 60px -20px rgba(17, 35, 75, 0.35);`
- `.join-cta__inner::after` glow — change `background: linear-gradient(135deg, rgba(84,164,247,0.06), rgba(84,164,247,0.02));` → `background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04));` (subtle white glow on the blue).
- `.join-cta__kicker` `color: var(--color-accent-from);` → `color: var(--lh-navy);`
- `.join-cta__headline` uses `color: var(--color-text)` → resolves to navy via community, but it's an `<h2>` so the community `:is(h2)` rule makes it **white**. The `<span class="gradient-text">to play?</span>` inside it uses `.gradient-text { color: var(--color-accent-to) }` (brand blue) — on the blue surface that vanishes; change just this instance: add `.section--community .gradient-text { color: var(--lh-navy); }` to the JoinCTA `<style>` (so "to play?" is navy, contrasting the white "Ready"). 
- `.join-cta__sub` uses `var(--color-text-muted)` → navy. Leave.
- `.join-cta__location` uses `var(--color-text-faint)` → in community that token wasn't overridden, so it still resolves to the theme faint (light slate / could be low-contrast on blue). Override: add `.section--community .join-cta__location { color: rgba(17,35,75,0.8); }` for AA. And `.join-cta__venue` `color: var(--color-accent-from);` → `color: var(--lh-navy);` (keep font-weight 700).
- `.join-cta__secondary` `color: var(--color-accent-from);` → `color: var(--lh-navy);` and its `border-bottom: 1px solid var(--color-border);` → `border-bottom: 1px solid rgba(17,35,75,0.3);` and `:hover` border → `rgba(17,35,75,0.7)`.
- The primary button `.btn--primary` is handled by the `.section--community .btn--primary { background:#fff; color:navy }` rule from Task 1 — no change needed in this file.

- [ ] **Step 3: Verify build + render in both themes**

Run: `npm run build` → success.
Chrome DevTools MCP: load `/`, screenshot JoinCTA in light and dark.
Expected: vivid `#54a4f7` card; white "Ready" + navy "to play?" headline; navy body/kicker/location; white "Join the Club" button; readable in both themes.

- [ ] **Step 4: Commit**

```bash
git add src/components/JoinCTA.astro
git commit -m "feat(tones): JoinCTA → community"
```

---

### Task 5: /events open-session cards → community

**Files:**
- Modify: `src/pages/events.astro` (session-card markup classes + `is:global` styles)

> Reminder: `events.astro` styles are in a `<style is:global>` block — use plain selectors.

- [ ] **Step 1: Add community to each session card**

In the markup, each open-session card is `<div class="session-card">` (and one `<div class="session-card session-card--venue">`). Add `section--community`:
- `<div class="session-card">` → `<div class="session-card section--community">`
- `<div class="session-card session-card--venue">` → `<div class="session-card session-card--venue section--community">`

- [ ] **Step 2: Retoken the card styles (navy text on blue; drop navy bg)**

In the `<style is:global>` block:
- `.session-card` — change `background: var(--lh-navy);` → remove it (community class provides `#54a4f7`); change `border: 1px solid rgba(84,164,247,0.2);` → `border: 1px solid rgba(17,35,75,0.18);`
- `.session-card__day` `color: var(--lh-blue);` → `color: var(--lh-navy);`
- `.session-card__time` `color: #fff;` → `color: var(--lh-navy);`
- `.session-card__level` `color: var(--lh-blue-300);` → `color: rgba(17,35,75,0.75);`
- `.session-card__venue` `color: rgba(255,255,255,0.7);` → `color: rgba(17,35,75,0.8);`
- `.session-card--venue` — if it sets its own background, remove it (inherits community). Check and remove any `background: ...` on it.
- `.session-card__venue-label` `color: rgba(255,255,255,0.6);` → `color: rgba(17,35,75,0.7);`
- `.session-card--venue strong` `color: #fff;` → `color: var(--lh-navy);`
- `.session-card--venue span` `color: rgba(255,255,255,0.7);` → `color: rgba(17,35,75,0.8);`
- `.session-card__map-link` `color: var(--lh-blue);` → `color: var(--lh-navy);` (add `font-weight:700` already present)
- `.session-card__transport` `color: var(--lh-blue-300);` → `color: rgba(17,35,75,0.7);`

- [ ] **Step 3: Verify build + render in both themes**

Run: `npm run build` → success.
Chrome DevTools MCP: load `/events`, screenshot the open-session cards in light and dark.
Expected: the session cards are vivid `#54a4f7` with navy text (day/time/level/venue), legible in both themes; the venue card matches. The fixtures list below stays navy/light feature-style (unchanged).

- [ ] **Step 4: Commit**

```bash
git add src/pages/events.astro
git commit -m "feat(tones): /events open-session cards → community"
```

---

### Task 6: /join "Come to an Open Session" pathway → community

**Files:**
- Modify: `src/pages/join.astro` (featured pathway class + CSS)

- [ ] **Step 1: Add community to the featured pathway**

In the markup, `<div class="pathway pathway--featured">` → `<div class="pathway pathway--featured section--community">`.

- [ ] **Step 2: Drop the navy gradient + retoken**

In `<style>`:
- `.pathway--featured` — change `background: linear-gradient(135deg, var(--lh-navy), var(--lh-navy-raised));` → remove it (community class provides `#54a4f7`); keep `border-color: rgba(17,35,75,0.3);` (change from the blue border to navy-tint).
- `.pathway--featured::before` glow `background: rgba(255,255,255,0.05);` → leave (subtle white glow on blue, fine).
- `.pathway--featured .pathway__body` `color: rgba(255,255,255,0.8);` → `color: var(--lh-navy);`
- `.pathway--featured .pathway__title` `color: #fff;` → the title is an `<h2>`, so the community `:is(h2)` rule already makes it white. Remove this explicit rule (or leave it — same result; prefer remove to avoid duplication).
- `.pathway--featured .pathway__rec` ("Best way in" kicker): check its colour; if it's a light/blue accent, set `.pathway--featured .pathway__rec { color: var(--lh-navy); }` for AA on blue.
- The CTA is `.btn btn--white` (already white fill / navy text) — fine on community.

- [ ] **Step 3: Verify build + render in both themes**

Run: `npm run build` → success.
Chrome DevTools MCP: load `/join`, screenshot the pathways in light and dark.
Expected: the "Come to an Open Session" featured card is vivid `#54a4f7` (white title, navy body/kicker, white CTA); the other two pathway cards stay neutral/light; readable in both themes.

- [ ] **Step 4: Commit**

```bash
git add src/pages/join.astro
git commit -m "feat(tones): /join open-session pathway → community"
```

---

### Task 7: Verification pass

**Files:** none (verification only)

- [ ] **Step 1: Build + check + tests**

Run: `npm run build && npx astro check && npm test`
Expected: build succeeds; astro check only the 2 pre-existing errors; Vitest 56 pass.

- [ ] **Step 2: Visual rhythm — both themes**

Chrome DevTools MCP at 1440×900. For each of `/`, `/events`, `/join`: set `data-theme="light"` (screenshot), then `data-theme="dark"` (screenshot).
Expected:
- Homepage rhythm: hero (navy) → SessionsStrip (community blue) → About (neutral) → CommunitySection (neutral) → ClubBridge (navy COMPETE | blue CONNECT) → JoinCTA (community blue) → Sponsors (neutral) → Instagram (neutral).
- Dark theme: feature/navy bands use deep-navy `#05122b` and separate from the navy page; community blue identical to light.
- `/events`: open-session cards community blue; fixtures feature/neutral. `/join`: featured pathway community blue.
- Neutral sections (About, Community, Sponsors, Instagram) unchanged from before this phase.

- [ ] **Step 3: AA sweep — both themes**

For `/`, `/events`, `/join` in **both** themes, run the contrast audit (skips aria-hidden; composites alpha). Use this in `evaluate_script`:
```js
() => {
  function parse(s){const m=s.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(',').map(x=>parseFloat(x));return p.length>=3?[p[0],p[1],p[2],p[3]??1]:null;}
  function comp(t,b){const a=t[3];return[t[0]*a+b[0]*(1-a),t[1]*a+b[1]*(1-a),t[2]*a+b[2]*(1-a)];}
  function bgOf(el){const L=[];let n=el,base=[255,255,255];while(n){const p=parse(getComputedStyle(n).backgroundColor);if(p&&p[3]>0){if(p[3]>=0.999){base=[p[0],p[1],p[2]];break;}L.push(p);}n=n.parentElement;}let c=base;for(let i=L.length-1;i>=0;i--)c=comp(L[i],c);return c;}
  function lum(c){const a=c.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2];}
  const fails=[];document.querySelectorAll('body *').forEach(el=>{
    if(el.closest('[aria-hidden="true"]'))return;
    const own=Array.from(el.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
    if(!own||!/[a-z0-9]/i.test(own))return;
    const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity===0)return;
    let fg=parse(cs.color);if(!fg)return;const bg=bgOf(el);if(fg[3]<1)fg=[...comp(fg,bg),1];
    const L1=lum(fg)+0.05,L2=lum(bg)+0.05;const ratio=L1>L2?L1/L2:L2/L1;
    const size=parseFloat(cs.fontSize),bold=parseInt(cs.fontWeight)>=700;const min=(size>=24||(bold&&size>=18.66))?3:4.5;
    if(ratio<min-0.05)fails.push({cls:(el.className&&el.className.toString().slice(0,30))||el.tagName,txt:own.slice(0,16),ratio:+ratio.toFixed(2)});});
  const seen=new Set(),out=[];for(const f of fails){const k=f.cls+f.ratio;if(!seen.has(k)){seen.add(k);out.push(f);}}return out;
}
```
Expected: `[]` for each page/theme. Community sections: white headings (large → pass), navy body (≈4.5:1 → pass). If a real failure appears (gradient/`set:html` false positives aside — verify those manually), nudge the specific colour and re-run.

- [ ] **Step 4: Done**

Phase 3-B complete.

---

## Self-review against the spec

**Spec coverage:**
- Refined feature (dark deep-navy + no-JS mirror) + community (A: white head/navy body, navy eyebrow, white button) → Task 1. ✓
- Community mapping: SessionsStrip (T2), ClubBridge CONNECT (T3), JoinCTA (T4), /events cards (T5), /join pathway (T6). ✓
- Feature mapping: ClubBridge COMPETE (T3); /events fixtures stay feature/neutral (unchanged); Hero unchanged. ✓
- Neutral sections unchanged (About/Community/Sponsors/Instagram — no task touches them). ✓
- AA both themes → Task 7 Step 3. ✓
- `set:html`/`is:global` gotcha → called out in header + Task 5. ✓
- `/teams` minimal scope → no task (only formalise if inconsistent; left out to avoid scope creep). ✓

**Placeholder scan:** No TBD/TODO; each step gives exact before→after edits. Two steps say "check its colour / if it sets a background, remove it" (`.session-card--venue`, `.pathway__rec`) — these are explicit conditional instructions with the exact replacement given, because the current value is a minor detail; acceptable (the implementer reads the one line and applies the stated navy value).

**Type/name consistency:** `.section--feature` / `.section--community` class names match between the Task-1 definitions and every application (T2–T6). The community token contract (`--color-text`/`--color-text-muted` → navy, `:is(h1,h2,h3)` → white, `.btn--primary` → white) defined in Task 1 is what Tasks 4/6 rely on for headings/buttons. Navy literal `rgba(17,35,75,…)` = `--lh-navy` used consistently for AA on community surfaces.
