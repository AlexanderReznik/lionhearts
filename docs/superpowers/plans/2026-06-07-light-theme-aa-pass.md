# Light-Theme WCAG AA Pass (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the light theme WCAG-AA compliant by replacing the flat brand blue `#54a4f7` *as text* on light surfaces with a darker accent-text colour (`#0050b8`), via a theme-aware token, plus fixing footer pills, ghost buttons, and faint text — without changing the dark theme.

**Architecture:** Add one semantic token `--color-accent-text` (light `#0050b8`, dark `#54a4f7`); dark surfaces inside the light theme (`.section--feature` + a few page-specific dark panels) override it back to `--lh-blue`. Repoint every accent-*text* usage to that token; leave accent *backgrounds*/buttons/knob/gradients on `#54a4f7`. Footer pill labels move to the text token (network colour on the icon), `.btn--ghost` uses `--color-text`, and light `--color-text-faint` is darkened.

**Tech Stack:** Astro 6 (static), CSS custom properties, scoped + global CSS, Chrome DevTools MCP for the AA audit.

**Spec:** `docs/superpowers/specs/2026-06-07-light-theme-aa-pass-design.md`

**Conventions:** No inline `style=`. External links keep `rel="noopener noreferrer"`. Run git from project root (no `git -C`). Branch: `light-theme-aa-pass`. **Community white headings on `#54a4f7` are an accepted brand exception — do NOT change them.**

**Baseline:** Confirm `npm run build`, `npx astro check` (2 pre-existing errors), `npm test` (56) green. Dev server `npm run dev` → http://localhost:4321/. To force a theme in DevTools: `document.documentElement.setAttribute('data-theme','light'|'dark')`.

**Verification model:** CSS-only — no new unit tests. Verify via `npm run build` + the Chrome DevTools AA audit (both themes) in the final task.

---

### Task 1: Token foundation + global repoints

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Add `--color-accent-text` to all theme blocks**

In the `:root` block, add (near the other `--color-*` semantic tokens):
```css
  --color-accent-text:  #0050b8;
```
In the `[data-theme="dark"]` block, add:
```css
  --color-accent-text:  var(--lh-blue);
```
In the `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` block, add:
```css
    --color-accent-text:  var(--lh-blue);
```
In the `.force-light` block, add:
```css
  --color-accent-text:  #0050b8;
```

- [ ] **Step 2: Feature surfaces keep light-blue accent text**

In the `.section--feature` rule, add:
```css
  --color-accent-text: var(--lh-blue);
```
(So accent text on navy feature surfaces stays `#54a4f7`, which passes on navy.)

- [ ] **Step 3: Darken light `--color-text-faint`**

In the `:root` block, change:
```css
  --color-text-faint:   var(--lh-slate-400);
```
to:
```css
  --color-text-faint:   #5e6c88;
```
Also in the `.force-light` block, change its `--color-text-faint: var(--lh-slate-400);` to `--color-text-faint: #5e6c88;`.
(Leave the `[data-theme="dark"]` and `@media` dark values at `#94a1c0` — already AA.)

- [ ] **Step 4: Repoint the global eyebrow + page-hero accents**

- `.eyebrow` rule: `color: var(--color-accent-to);` → `color: var(--color-accent-text);`
- `.eyebrow::before` rule: `background: var(--color-accent-to);` → `background: var(--color-accent-text);`
- `.page-hero__eyebrow`: `color: var(--color-accent-to);` → `color: var(--color-accent-text);`
- `.page-hero__eyebrow::before`: `background: var(--color-accent-to);` → `background: var(--color-accent-text);`
- `.page-hero__title em`: `color: var(--color-accent-to);` → `color: var(--color-accent-text);`
(Do NOT touch `.section--feature .eyebrow` / `.section--community .eyebrow` overrides — they set white/navy explicitly and win.)

- [ ] **Step 5: Fix `.btn--ghost`**

Replace the two `.btn--ghost` rules:
```css
.btn--ghost { background: transparent; color: rgba(255,255,255,0.8); border: 1px solid rgba(255,255,255,0.28); }
.btn--ghost:hover { border-color: rgba(255,255,255,0.55); color: #fff; }
```
with:
```css
.btn--ghost { background: transparent; color: var(--color-text); border: 1px solid color-mix(in srgb, var(--color-text) 30%, transparent); }
.btn--ghost:hover { border-color: color-mix(in srgb, var(--color-text) 55%, transparent); }
```

- [ ] **Step 6: Document the community-heading exception**

Above the `.section--community :is(h1, h2, h3) { color: var(--lh-white); }` rule, add a comment:
```css
/* NOTE: white headings on #54a4f7 are ~2.62:1 — below AA. Kept deliberately
   per the brand book's Style #2; accepted exception (body text is navy/AA). */
```

- [ ] **Step 7: Verify build**

Run: `npm run build` → success.
In Chrome DevTools at `/teams` (set `data-theme="light"`): the page-hero eyebrow + "MEET OUR TEAMS" accent now render the deeper `#0050b8` blue.

- [ ] **Step 8: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(a11y): add --color-accent-text token; repoint global eyebrows, ghost btn, faint text"
```

---

### Task 2: Footer (pills + headings + email)

**Files:**
- Modify: `src/components/Footer.astro`

- [ ] **Step 1: Repoint the column headings + email link to accent-text**

In `<style>`, `.footer__col h4` `color: var(--color-accent-to);` → `color: var(--color-accent-text);`
(Read the file; if the contact email `<a>` or any other footer text uses `var(--color-accent-to)`/`--lh-blue` as colour, repoint those to `var(--color-accent-text)` too.)

- [ ] **Step 2: Move social-pill network colour from label to icon**

The per-network rules currently colour the whole pill label, e.g.:
```css
  .footer__social-pill--instagram { color: rgba(225,48,108,0.75); }
  .footer__social-pill--facebook  { color: rgba(74,158,245,0.75); }
  .footer__social-pill--youtube   { color: rgba(255,68,68,0.75); }
```
Replace those three with icon-scoped rules (label keeps the base `var(--color-text-muted)`, which is AA in both themes):
```css
  .footer__social-pill--instagram .footer__social-icon { color: #e1306c; }
  .footer__social-pill--facebook  .footer__social-icon { color: #4a9ef5; }
  .footer__social-pill--youtube   .footer__social-icon { color: #ff4444; }
```

- [ ] **Step 3: Remove the now-redundant Phase-2 dark label overrides**

Delete the dark-only label overrides added in Phase 2 (they coloured the whole pill label):
```css
  :global(html[data-theme="dark"]) .footer__social-pill--instagram,
  :global(html[data-theme="dark"]) .footer__social-pill--instagram:hover { color: #f48fb1; }
  :global(html[data-theme="dark"]) .footer__social-pill--facebook,
  :global(html[data-theme="dark"]) .footer__social-pill--facebook:hover { color: #8fc0ff; }
  :global(html[data-theme="dark"]) .footer__social-pill--youtube,
  :global(html[data-theme="dark"]) .footer__social-pill--youtube:hover { color: #ff8a8a; }
```
(The label is now `--color-text-muted` — AA in both themes — so these are unnecessary.)
Keep the existing `:hover` rules that set border-color tints; if a hover rule also sets the label `color` to a network colour, scope that colour to `.footer__social-icon` instead (icon brighten on hover), leaving the label on the token.

- [ ] **Step 4: Verify build + render both themes**

Run: `npm run build` → success.
Chrome DevTools: footer in light → navy labels, coloured icons, navy-blue column headings; in dark → light labels, coloured icons. Legible both.

- [ ] **Step 5: Commit**

```bash
git add src/components/Footer.astro
git commit -m "fix(a11y): footer pill labels use text token (icon keeps network colour); headings → accent-text"
```

---

### Task 3: Homepage section components + Nav

**Files:**
- Modify: `src/components/AboutIntro.astro`, `CommunitySection.astro`, `SponsorsSection.astro`, `InstagramFeed.astro`, `OverheardArchive.astro`, `TeamCard.astro`, `Nav.astro`

Repoint accent-**text** usages (colour) from `var(--color-accent-to)` / `var(--color-accent-from)` / `var(--color-highlight-1)` / `var(--lh-blue)` to `var(--color-accent-text)`. Do NOT change background/gradient usages.

- [ ] **Step 1: AboutIntro.astro**
- `.about-intro__headline em` `color: var(--color-accent-to);` → `var(--color-accent-text)`
- `.about-intro__link` `color: var(--color-accent-to);` → `var(--color-accent-text)`
- `.about-intro__postcode` `color: var(--color-highlight-1);` → `var(--color-accent-text)`

- [ ] **Step 2: CommunitySection.astro**
- `.community__headline em` `color: var(--color-accent-to);` → `var(--color-accent-text)`
(The section's `.eyebrow` is the global class — already fixed in Task 1.)

- [ ] **Step 3: SponsorsSection.astro**
- `.sponsors__link` `color: var(--color-accent-to);` → `var(--color-accent-text)`
(Leave `.sponsors__badge` — it's white text on a blue accent bg, fine.)

- [ ] **Step 4: InstagramFeed.astro**
- The accent-text rule at ~line 76 `color: var(--color-accent-to);` → `var(--color-accent-text)`. (Leave the follow-button gradient bg + its white text.)

- [ ] **Step 5: OverheardArchive.astro**
- The accent-text rule at ~line 98 `color: var(--color-accent-to);` → `var(--color-accent-text)`.

- [ ] **Step 6: TeamCard.astro**
- `.team-card__gender` `color: var(--color-highlight-1);` → `var(--color-accent-text)`.

- [ ] **Step 7: Nav.astro**
- `.nav__link--active` `border-bottom-color: var(--color-accent-to);` → `border-bottom-color: var(--color-accent-text);`
- `.nav__overlay-link--active` `color: var(--color-accent-to);` → `color: var(--color-accent-text);`

- [ ] **Step 8: Verify + commit**

Run: `npm run build` → success.
```bash
git add src/components/AboutIntro.astro src/components/CommunitySection.astro src/components/SponsorsSection.astro src/components/InstagramFeed.astro src/components/OverheardArchive.astro src/components/TeamCard.astro src/components/Nav.astro
git commit -m "fix(a11y): repoint homepage section + nav accent text to --color-accent-text"
```

---

### Task 4: Pages — accent text + dark-panel overrides

**Files:**
- Modify: `src/pages/events.astro`, `contact.astro`, `sponsorship.astro`, `about.astro`, `join.astro`, `404.astro`, `join-success.astro`

- [ ] **Step 1: Dark-panel local overrides (keep light-blue accent on navy panels)**

Add `--color-accent-text: var(--lh-blue);` to the root rule of each page-specific DARK panel so its accent text stays light-blue:
- `contact.astro` → `.location-info` rule (the navy "Find Us" panel).
- `sponsorship.astro` → `.sponsor-hero` rule AND `.become-sponsor` rule (the navy panels).
(If these panels use `<style is:global>` blocks, plain selectors are fine; check and match the file's existing pattern. If scoped, add the declaration directly to the panel's rule.)

- [ ] **Step 2: contact.astro accent text → token**
- `.contact-card__tag` (`color: var(--color-accent-to);`) → `var(--color-accent-text)`
- `.contact-card__link` (`color: var(--color-highlight-1);`) → `var(--color-accent-text)`
- `.location-info__headline em` (`color: var(--lh-blue);`) → `var(--color-accent-text)` — now resolves to light-blue via the panel override from Step 1.
- `.location-info__directions` / any `.location-info` accent at `var(--lh-blue)` (~line 246) → `var(--color-accent-text)`.

- [ ] **Step 3: sponsorship.astro accent text → token**
- `.sponsor-hero__link` (`color: var(--lh-blue);` ~line 137) → `var(--color-accent-text)` (light-blue via Step 1 override).
- Any other `--lh-blue`/`--color-accent-to` *text* in `.sponsor-hero`/`.become-sponsor` → `var(--color-accent-text)`.

- [ ] **Step 4: events.astro accent text → token**

In the `<style is:global>` block, repoint accent **text** on LIGHT surfaces (fixtures/sessions-box) — these are NOT inside a dark panel, so they resolve to `#0050b8`:
- `~line 364` `color: var(--lh-blue);` → `var(--color-accent-text)`
- `~line 434` `color: var(--color-highlight-1);` → `var(--color-accent-text)`
- `.tl-row-up--next .tl-date` (`~line 514` `color: var(--lh-blue);`) → `var(--color-accent-text)`
(Leave the community `.session-card` text — it's navy from Phase 3-B. Leave result-badge colours.)

- [ ] **Step 5: about.astro accent text → token**
- `.about-history__headline em` (`color: var(--color-accent-to);` ~line 142) → `var(--color-accent-text)`.

- [ ] **Step 6: join.astro accent text + form controls → token**
- `.join-form__note a` (`color: var(--color-accent-to);` ~line 403) → `var(--color-accent-text)`
- input focus `border-color: var(--color-accent-to);` (~line 352) → `var(--color-accent-text)` (focus indicator AA, non-text 3:1)
- `accent-color: var(--color-accent-from);` (~line 381) → `accent-color: var(--color-accent-text);` (checkbox control AA)
(The featured pathway is community — its title white exception, body navy — leave from Phase 3-B.)

- [ ] **Step 7: 404.astro + join-success.astro**
- `404.astro` `~line 40` `color: var(--color-accent-to);` → `var(--color-accent-text)`
- `join-success.astro` `.success-page__link` (`~line 52` `color: var(--color-accent-to);`) → `var(--color-accent-text)`

- [ ] **Step 8: Verify + commit**

Run: `npm run build` → success. `npx astro check` → no new errors.
```bash
git add src/pages/events.astro src/pages/contact.astro src/pages/sponsorship.astro src/pages/about.astro src/pages/join.astro src/pages/404.astro src/pages/join-success.astro
git commit -m "fix(a11y): repoint page accent text to --color-accent-text; dark-panel local overrides"
```

---

### Task 5: AA verification (both themes, all pages)

**Files:** none (verification only)

- [ ] **Step 1: Build + check + tests**

Run: `npm run build && npx astro check && npm test`
Expected: build ok; astro check only the 2 pre-existing errors; Vitest 56 pass.

- [ ] **Step 2: Light-theme AA audit — every page**

In Chrome DevTools MCP, set `localStorage['lh-theme']='light'`. For each of `/`, `/about`, `/teams`, `/events`, `/join`, `/sponsorship`, `/contact`, `/404`, `/join-success`, `/sponsors/vinarius`: navigate, then run the audit:
```js
() => {
  function parse(s){const m=s.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(',').map(x=>parseFloat(x));return p.length>=3?[p[0],p[1],p[2],p[3]??1]:null;}
  function comp(t,b){const a=t[3];return[t[0]*a+b[0]*(1-a),t[1]*a+b[1]*(1-a),t[2]*a+b[2]*(1-a)];}
  function grad(el){let n=el;while(n){const bi=getComputedStyle(n).backgroundImage;if(bi&&bi.includes('gradient'))return true;n=n.parentElement;}return false;}
  function bgOf(el){const L=[];let n=el,base=[255,255,255];while(n){const p=parse(getComputedStyle(n).backgroundColor);if(p&&p[3]>0){if(p[3]>=0.999){base=[p[0],p[1],p[2]];break;}L.push(p);}n=n.parentElement;}let c=base;for(let i=L.length-1;i>=0;i--)c=comp(L[i],c);return c;}
  function lum(c){const a=c.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2];}
  const fails=[];document.querySelectorAll('body *').forEach(el=>{
    if(el.closest('[aria-hidden="true"]')||el.closest('.hero')||el.closest('.section--community'))return; // skip photo hero + community-heading exception
    const own=Array.from(el.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
    if(!own||!/[a-z0-9]/i.test(own))return;
    const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity===0)return;
    let fg=parse(cs.color);if(!fg)return;const bg=bgOf(el);if(fg[3]<1)fg=[...comp(fg,bg),1];
    const L1=lum(fg)+0.05,L2=lum(bg)+0.05;const ratio=L1>L2?L1/L2:L2/L1;
    const size=parseFloat(cs.fontSize),bold=parseInt(cs.fontWeight)>=700;const min=(size>=24||(bold&&size>=18.66))?3:4.5;
    if(ratio<min-0.05)fails.push({cls:(el.className&&el.className.toString().slice(0,30))||el.tagName,r:+ratio.toFixed(2),grad:grad(el)?1:0});});
  const seen=new Set(),out=[];for(const f of fails){const k=f.cls+f.r;if(!seen.has(k)){seen.add(k);out.push(f);}}return out;
}
```
Expected: `[]` for each page, OR only `grad:1` entries (verify those manually — text on a gradient/dark panel is fine if ≥4.5 against the real panel colour; e.g. light-blue accent on navy = 5.8:1). The `.section--community` exception is skipped by the audit. Any solid-bg `grad:0` failure must be fixed (repoint missed element) and re-audited.

- [ ] **Step 3: Dark-theme regression audit**

Set `localStorage['lh-theme']='dark'`. Re-run the audit on `/`, `/events`, `/join`, `/contact`, `/sponsorship`. Expected: `[]` (accent text = `#54a4f7` on navy passes; feature panels keep light-blue). Confirms no dark regression.

- [ ] **Step 4: Visual spot-check (light)**

Screenshot `/`, `/teams`, `/contact`, `/join` in light: eyebrows/links/labels read as a deeper confident blue; footer pills (navy labels, coloured icons); ghost buttons visible on light cards; faint text legible.

- [ ] **Step 5: Done**

Light-theme AA pass complete.

---

## Self-review against the spec

**Spec coverage:**
- ① `--color-accent-text` token (light/dark/no-JS/force-light + feature override) → Task 1 Steps 1–2; repoints → Task 1 Step 4 (global eyebrows/page-hero), Task 2 (footer h4/email), Task 3 (homepage components + nav), Task 4 (pages). ✓
- Dark-panel local overrides (sponsor-hero, become-sponsor, location-info) → Task 4 Step 1. ✓
- ③ Footer pills (label→token, icon colour, remove Phase-2 dark overrides) → Task 2. ✓
- ④ `.btn--ghost` via `--color-text` → Task 1 Step 5. ✓
- ⑤ Light `--color-text-faint` darkened → Task 1 Step 3. ✓
- ② Community white-heading exception documented, not changed → Task 1 Step 6 + audit skips it (Task 5). ✓
- Dark theme unchanged + verified → Task 5 Step 3. ✓

**Placeholder scan:** No TBD/TODO. The "if the file uses other accent-text" instructions in Tasks 2/4 are explicit repoint criteria (target = `var(--color-accent-text)`), not vague — line numbers are approximate but the exact selector + before/after value is given for each.

**Type/name consistency:** `--color-accent-text` defined in Task 1 and used identically in Tasks 2–4. Repoints are all `var(--color-accent-to|from)`/`var(--color-highlight-1)`/`var(--lh-blue)` (text) → `var(--color-accent-text)`. Background/button/gradient usages are explicitly excluded. The audit (Task 5) skips `.section--community` (the accepted exception) and `.hero` (photo), and flags `grad:1` for manual check — matching how the brainstorm audits behaved.
