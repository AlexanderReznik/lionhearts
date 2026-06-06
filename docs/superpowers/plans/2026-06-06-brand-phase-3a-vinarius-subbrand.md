# Brand Phase 3-A — Vinarius Sub-Brand (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle `/sponsors/vinarius` to the brand-book Vinarius sub-brand — burgundy `#6E0833` + beige `#ECF5D9` (no gold), a burgundy→navy "connection" hero gradient, and scoped open-font substitutes (Hanken Grotesk + Playfair Display).

**Architecture:** All work is confined to one page (`src/pages/sponsors/vinarius.astro`) plus two Fontsource deps and one copied logo asset. The page already has its own scoped `--vin-*` palette and a `.force-light` wrapper (so it renders identically under global light/dark); we replace the improvised palette/fonts with brand-accurate ones and recolour every section.

**Tech Stack:** Astro 6 (static), scoped page CSS, Fontsource (Hanken Grotesk + Playfair Display, OFL), Chrome DevTools MCP for visual + AA verification.

**Spec:** `docs/superpowers/specs/2026-06-06-brand-phase-3a-vinarius-subbrand-design.md`

**Conventions:** No inline `style=`. External links keep `rel="noopener noreferrer"`. Heading hierarchy preserved. Run git from the project root (no `git -C`). Branch: `brand-phase-3a-vinarius`.

**Baseline:** On `brand-phase-3a-vinarius`, confirm `npm run build`, `npx astro check` (2 known pre-existing errors — Hero.astro relatedTarget, contact.astro BRAND_ICONS), and `npm test` (56) are green. Dev server: `npm run dev` → http://localhost:4321/.

**Verification model:** CSS/visual page — no new unit tests. Each task verifies via `npm run build` + Chrome DevTools MCP screenshots. Final task greps for removed values (gold/Georgia/old tokens) and confirms theme-independence + AA.

**Note on transient state:** Tasks 2–4 recolour the page section-by-section; between them some lower sections briefly reference now-removed tokens. Undefined CSS custom properties don't error the build (they resolve to nothing), so each task still builds — the page is fully correct after Task 4.

---

### Task 1: Fonts + page type setup

**Files:**
- Modify: `package.json` (via npm)
- Modify: `src/pages/sponsors/vinarius.astro` (frontmatter imports; wrapper class; `--vin-font-*` tokens; serif-accent application)

- [ ] **Step 1: Install the substitute fonts (OFL, self-hosted)**

Run:
```bash
npm install @fontsource-variable/hanken-grotesk @fontsource/playfair-display
```
Expected: both added to `dependencies`. If `@fontsource-variable/hanken-grotesk`
404s, fall back to `npm install @fontsource/hanken-grotesk` and use the non-variable
imports/family name noted in Step 2.

- [ ] **Step 2: Import the needed weights in the page frontmatter**

In `src/pages/sponsors/vinarius.astro`, the frontmatter is currently:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
---
```
Change it to:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import '@fontsource-variable/hanken-grotesk';
import '@fontsource/playfair-display/400-italic.css';
import '@fontsource/playfair-display/600-italic.css';
---
```
> If `@fontsource-variable/hanken-grotesk` fails to resolve, use the non-variable weights instead: `import '@fontsource/hanken-grotesk/500.css';`, `/700.css`, `/800.css`. Pick whichever installed; the family name is `'Hanken Grotesk Variable'` for the variable package or `'Hanken Grotesk'` for the non-variable one — match it in the token in Step 4.

- [ ] **Step 3: Add a `vin-page` class to the wrapper so the page's type is scoped**

In the markup, the content wrapper is currently `<div class="force-light">` (line ~9). Change it to:
```astro
  <div class="force-light vin-page">
```
The matching `</div>` before `</BaseLayout>` stays.

- [ ] **Step 4: Add font tokens + apply the display font to the page**

In the `<style>` block, the palette `:root` block is at the top. Leave the colour tokens for Task 2; for now ADD the two font tokens to that `:root` block (append inside it):
```css
    --vin-font-display: 'Hanken Grotesk Variable', 'Hanken Grotesk', system-ui, sans-serif;
    --vin-font-serif:   'Playfair Display', Georgia, serif;
```
(If you used the non-variable Hanken package in Step 2, drop the `'Hanken Grotesk Variable'` entry.)

Then add a rule (anywhere in the `<style>` block, e.g. right after the `:root` block) so the whole sub-brand page uses the display font:
```css
  .vin-page { font-family: var(--vin-font-display); }
```

- [ ] **Step 5: Apply the serif (Playfair italic) to the serif accents**

Replace the `.vin-quote__mark` rule's `font-family: Georgia, serif;` (line ~518) with:
```css
    font-family: var(--vin-font-serif);
```
And in `.vin-hero__latin` (line ~242) add a `font-family` so the Latin line uses Playfair italic — change the rule to include:
```css
    font-family: var(--vin-font-serif);
```
(It already has `font-style: italic;` — keep it.)

- [ ] **Step 6: Verify build + render**

Run: `npm run build` → success (Hanken/Playfair woff2 emitted).
In Chrome DevTools MCP: navigate to http://localhost:4321/sponsors/vinarius, screenshot the hero.
Expected: headings now render in Hanken Grotesk; the "vinarius, n. …" line renders in Playfair italic. (Colours are still the old gold/wine scheme — fixed next.)

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/pages/sponsors/vinarius.astro
git commit -m "feat(vinarius): scoped Hanken Grotesk + Playfair Display fonts"
```

---

### Task 2: Brand palette tokens + hero (G1 gradient)

**Files:**
- Modify: `src/pages/sponsors/vinarius.astro` (`:root` colour tokens; hero markup + CSS)

- [ ] **Step 1: Replace the colour tokens**

In the `<style>` `:root` block, replace the five wine-palette colour lines:
```css
    --vin-dark:   #0e0409;
    --vin-mid:    #6b1728;
    --vin-bright: #9b2f3e;
    --vin-gold:   #c9a43e;
    --vin-cream:  rgba(255, 246, 230, 0.85);
```
with the brand-accurate set (keep the two `--vin-font-*` lines added in Task 1):
```css
    --vin-burgundy:      #6E0833;
    --vin-burgundy-deep: #4a0622;
    --vin-beige:         #ECF5D9;
    --vin-navy:          #11234B;
    --vin-navy-mid:      #1c2a55;
    --vin-plum:          #3a1442;
```

- [ ] **Step 2: Remove the gold stripe from the hero markup**

In the markup, delete this line (line ~13):
```astro
    <div class="vin-hero__stripe" aria-hidden="true"></div>
```

- [ ] **Step 3: Recolour the hero to the G1 gradient**

Replace the `.vin-hero` rule (lines ~179-186) with:
```css
  .vin-hero {
    min-height: 92vh;
    position: relative;
    display: flex;
    align-items: center;
    overflow: hidden;
    background: linear-gradient(125deg, #6E0833 0%, #5a1338 38%, #1c2a55 75%, #11234b 100%);
  }
```

Replace the `.vin-hero__bg` rule (lines ~188-195) with a subtle beige depth glow (no more blue/wine radials):
```css
  .vin-hero__bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 60% at 78% 38%, rgba(236, 245, 217, 0.06), transparent 70%);
  }
```

Delete the `.vin-hero__stripe` rule entirely (lines ~197-204).

- [ ] **Step 4: Recolour the hero content (drop gold → beige)**

Replace `.vin-hero__badge` (lines ~215-227):
```css
  .vin-hero__badge {
    display: inline-block;
    background: rgba(236, 245, 217, 0.12);
    border: 1px solid rgba(236, 245, 217, 0.4);
    color: var(--vin-beige);
    font-size: 0.5625rem;
    font-weight: 700;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: 3px;
    margin-bottom: 28px;
  }
```

Replace `.vin-hero__name` (lines ~229-240) — solid beige, display font, no gradient-text:
```css
  .vin-hero__name {
    font-family: var(--vin-font-display);
    font-size: clamp(4rem, 14vw, 11rem);
    font-weight: 800;
    line-height: 0.85;
    letter-spacing: -4px;
    text-transform: uppercase;
    color: var(--vin-beige);
    margin-bottom: 24px;
  }
```

Replace the `color:` lines in `.vin-hero__latin` (~244) and `.vin-hero__sub` (~252):
- `.vin-hero__latin` `color: rgba(255, 246, 230, 0.6);` → `color: rgba(236, 245, 217, 0.85);`
- `.vin-hero__sub` `color: rgba(255, 246, 230, 0.7);` → `color: rgba(236, 245, 217, 0.75);`

Replace `.vin-hero__cta` (lines ~259-273) and its `:hover` (~275-278):
```css
  .vin-hero__cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--vin-beige);
    border: 1px solid var(--vin-beige);
    border-radius: 4px;
    padding: 12px 24px;
    color: var(--vin-burgundy);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 1px;
    text-decoration: none;
    text-transform: uppercase;
    transition: opacity 0.2s;
  }
  .vin-hero__cta:hover { opacity: 0.9; }
```

- [ ] **Step 5: Verify build + hero render**

Run: `npm run build` → success.
Chrome DevTools MCP: reload `/sponsors/vinarius`, screenshot the hero.
Expected: burgundy→navy G1 gradient, beige "VINARIUS" (Hanken), Playfair italic Latin line, beige badge + beige CTA. No gold in the hero. (Sections below may show broken colours until Tasks 3–4 — expected.)

- [ ] **Step 6: Commit**

```bash
git add src/pages/sponsors/vinarius.astro
git commit -m "feat(vinarius): brand palette tokens + burgundy->navy hero gradient"
```

---

### Task 3: Recolour Manifesto + About + Facts

**Files:**
- Modify: `src/pages/sponsors/vinarius.astro` (manifesto, about, facts CSS)

- [ ] **Step 1: Manifesto (dark burgundy section)**

Replace `.vin-manifesto` background + borders (lines ~281-288):
```css
  .vin-manifesto {
    background: var(--vin-burgundy-deep);
    padding: 100px var(--page-px);
    position: relative;
    overflow: hidden;
    border-top: 1px solid rgba(236, 245, 217, 0.12);
    border-bottom: 1px solid rgba(236, 245, 217, 0.12);
  }
```
`.vin-manifesto__num` watermark colour (~296) `color: rgba(107, 23, 40, 0.18);` → `color: rgba(236, 245, 217, 0.10);`
`.vin-manifesto__headline` colour (~319) `color: #fff;` → `color: var(--vin-beige);`
`.vin-manifesto__body` colour (~324) `color: rgba(255, 246, 230, 0.65);` → `color: rgba(236, 245, 217, 0.75);`

- [ ] **Step 2: About (light section) — drop gold eyebrow/link**

`.vin-about__eyebrow` colour (~348) `color: var(--vin-gold);` → `color: var(--vin-burgundy);`
`.vin-about__headline` — add `color: var(--vin-burgundy);` (it currently inherits; make it burgundy). Change the rule (lines ~352-359) to include `color: var(--vin-burgundy);`.
`.vin-about__link` colour (~369) `color: var(--vin-gold);` → `color: var(--vin-burgundy);` and its border (~375) `border-bottom: 1px solid rgba(201, 164, 62, 0.3);` → `border-bottom: 1px solid rgba(110, 8, 51, 0.3);` and `:hover` (~380) `border-color: var(--vin-gold);` → `border-color: var(--vin-burgundy);`

- [ ] **Step 3: Facts grid**

`.vin-about__facts` background/border (~386-387):
- `background: rgba(107, 23, 40, 0.2);` → `background: rgba(110, 8, 51, 0.18);`
- `border: 1px solid rgba(107, 23, 40, 0.35);` → `border: 1px solid rgba(110, 8, 51, 0.3);`
`.vin-fact:hover` (~401) `background: rgba(107, 23, 40, 0.08);` → `background: rgba(110, 8, 51, 0.06);`
`.vin-fact__num` colour (~407) `color: #fff;` → `color: var(--vin-burgundy);`
`.vin-fact__label` colour (~413) `color: rgba(255, 246, 230, 0.55);` → `color: var(--color-text-muted);`

- [ ] **Step 4: Verify build + render**

Run: `npm run build` → success.
Chrome DevTools MCP: reload `/sponsors/vinarius`, screenshot the Manifesto + About + Facts sections.
Expected: Manifesto = deep-burgundy with beige text; About = light with burgundy headings/links + navy body; Facts = burgundy numbers on light cells. No gold.

- [ ] **Step 5: Commit**

```bash
git add src/pages/sponsors/vinarius.astro
git commit -m "feat(vinarius): recolour manifesto + about + facts to burgundy/beige"
```

---

### Task 4: Recolour Bridge + Quote + Visit

**Files:**
- Modify: `src/pages/sponsors/vinarius.astro` (bridge, quote, visit CSS)

- [ ] **Step 1: Bridge — Lionhearts navy vs Vinarius burgundy columns**

`.vin-bridge__col--sport` background (~434) `background: linear-gradient(135deg, #002fa8, #0058d8);` → `background: linear-gradient(135deg, #11234b, #1c2a55);`
`.vin-bridge__col--wine` background (~438) `background: linear-gradient(135deg, #5a1020, #8b1a2e);` → `background: linear-gradient(135deg, #4a0622, #6E0833);`
`.vin-bridge__divider` background (~442) `background: var(--vin-dark);` → `background: var(--vin-navy);`
(The white text/eyebrows in the bridge columns stay white — they're on dark navy/burgundy, AA-fine.)

- [ ] **Step 2: Quote — deep burgundy, Playfair mark**

`.vin-quote` background + borders (~502-505):
```css
  .vin-quote {
    background: var(--vin-burgundy-deep);
    padding: 100px var(--page-px);
    border-top: 1px solid rgba(236, 245, 217, 0.12);
    border-bottom: 1px solid rgba(236, 245, 217, 0.12);
  }
```
`.vin-quote__mark` colour (~517) `color: rgba(107, 23, 40, 0.6);` → `color: rgba(236, 245, 217, 0.5);` (font-family is already `--vin-font-serif` from Task 1).
`.vin-quote__text` colour (~529) `color: #fff;` → `color: var(--vin-beige);`
`.vin-quote__credit` colour (~538) `color: var(--vin-gold);` → `color: rgba(236, 245, 217, 0.75);`

- [ ] **Step 3: Visit — burgundy gradient, beige accents**

`.vin-visit` background (~543) `background: linear-gradient(135deg, #4a0e1c, #6b1728 50%, #4a0e1c);` → `background: linear-gradient(135deg, #4a0622, #6E0833 50%, #4a0622);`
`.vin-visit__eyebrow` colour (~563) `color: rgba(201, 164, 62, 0.8);` → `color: rgba(236, 245, 217, 0.85);`
`.vin-visit__headline` colour (~573) `color: #fff;` → `color: var(--vin-beige);`
`.vin-visit__headline em` colour (~578) `color: var(--vin-gold);` → `color: var(--vin-beige);` (keep `font-style: normal;`)
`.vin-visit__body` colour (~583) `color: rgba(255, 246, 230, 0.65);` → `color: rgba(236, 245, 217, 0.78);`
(The CTA in the Visit section is `class="btn btn--white"` — global white button, beige-ish on burgundy, fine. The CSS wine-glass uses `#fff` borders at 0.18 opacity — decorative, leave.)

- [ ] **Step 4: Verify build + render + no old colours remain**

Run: `npm run build` → success.
Run: `grep -nE 'c9a43e|201, ?164, ?62|0e0409|6b1728|9b2f3e|255, ?246, ?230|Georgia|--vin-(gold|dark|mid|bright|cream)' src/pages/sponsors/vinarius.astro` → expected **no matches** (all gold/old-wine/Georgia references gone).
Chrome DevTools MCP: reload `/sponsors/vinarius`, screenshot Bridge + Quote + Visit.
Expected: Bridge = navy (Lionhearts) | burgundy (Vinarius) columns; Quote = deep-burgundy with beige Playfair mark + beige text; Visit = burgundy gradient with beige headline/accents. No gold anywhere.

- [ ] **Step 5: Commit**

```bash
git add src/pages/sponsors/vinarius.astro
git commit -m "feat(vinarius): recolour bridge + quote + visit; remove all gold/old-wine refs"
```

---

### Task 5: Official Vinarius logo on a light surface

**Files:**
- Create: `public/brand/vinarius-logo-burgundy.svg` (copied)
- Modify: `src/pages/sponsors/vinarius.astro` (Visit section markup + CSS)

The burgundy logo needs a light background. The About section is light — add the official logo there as a small "title sponsor" mark above the About eyebrow.

- [ ] **Step 1: Copy the logo asset**

Run:
```bash
mkdir -p public/brand
cp "Lionhearts_Website_Assets/Logos_SVG/Vinarius_Sponsor_Logo_Burgundy.svg" public/brand/vinarius-logo-burgundy.svg
ls public/brand/vinarius-logo-burgundy.svg
```
Expected: file present.

- [ ] **Step 2: Add the logo to the About intro (light surface)**

In the markup, the About intro opens (line ~45-46):
```astro
      <div class="vin-about__intro">
        <p class="vin-about__eyebrow">About the Partner</p>
```
Insert the logo image as the first child of `.vin-about__intro`, before the eyebrow:
```astro
      <div class="vin-about__intro">
        <img class="vin-about__logo" src="/brand/vinarius-logo-burgundy.svg"
             alt="Vinarius London" width="180" height="48" loading="lazy" />
        <p class="vin-about__eyebrow">About the Partner</p>
```

- [ ] **Step 3: Style the logo**

Append to the `<style>` block:
```css
  .vin-about__logo {
    height: 44px;
    width: auto;
    margin-bottom: 24px;
    display: block;
  }
```

- [ ] **Step 4: Verify build + render**

Run: `npm run build` → success.
Chrome DevTools MCP: reload `/sponsors/vinarius`, scroll to the About section, screenshot.
Expected: the official burgundy Vinarius logo renders legibly on the light About background, above "About the Partner".

- [ ] **Step 5: Commit**

```bash
git add public/brand/vinarius-logo-burgundy.svg src/pages/sponsors/vinarius.astro
git commit -m "feat(vinarius): add official Vinarius logo on the light About surface"
```

---

### Task 6: Verification pass

**Files:** none (verification only)

- [ ] **Step 1: Build + check + tests**

Run:
```bash
npm run build && npx astro check && npm test
```
Expected: build succeeds; astro check shows only the 2 pre-existing errors; Vitest 56 pass (unchanged — no new tests).

- [ ] **Step 2: Full-page screenshot (light global theme)**

Chrome DevTools MCP at 1440×900: navigate `/sponsors/vinarius`, full-page screenshot.
Expected: cohesive burgundy/beige/navy sub-brand, Hanken + Playfair type, official logo on the About section, **no gold anywhere**, no near-black `#0e0409`.

- [ ] **Step 3: Theme-independence**

In Chrome DevTools MCP run `() => document.documentElement.setAttribute('data-theme','dark')`, then full-page screenshot `/sponsors/vinarius`.
Expected: **identical** to the light-theme screenshot (the page is self-contained sub-brand via `.force-light` + `--vin-*`). Reset with `removeAttribute('data-theme')`.

- [ ] **Step 4: No leakage into the Lionhearts brand**

Navigate `/` and screenshot the hero.
Expected: unchanged — Barlow + Lionhearts palette; the Vinarius fonts/colours did not leak (they're page-scoped).

- [ ] **Step 5: AA spot-check on the Vinarius page (dark + light surfaces)**

In Chrome DevTools MCP on `/sponsors/vinarius`, run the contrast audit (skips `aria-hidden` / decorative):
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
Expected: `[]`. If any failure appears, lighten/darken the specific text or surface to pass, re-run, then commit the fix.

- [ ] **Step 6: Done**

Phase 3-A complete.

---

## Self-review against the spec

**Spec coverage:**
- Burgundy/beige palette, drop gold → Tasks 2–4 (every section recoloured; Task 4 greps gold gone). ✓
- G1 burgundy→navy hero gradient → Task 2. ✓
- Scoped Hanken + Playfair substitutes → Task 1 (page-frontmatter imports + `.vin-page` font + `--vin-font-*`). ✓
- Official Vinarius logo on a light surface → Task 5 (About section). ✓
- Theme independence / no leakage → Task 6 Steps 3–4. ✓
- AA → Task 6 Step 5. ✓
- Scope = page only; homepage SponsorsSection untouched → no task touches it. ✓

**Placeholder scan:** No TBD/TODO; every step shows exact before→after CSS and commands. The font-package fallback (variable vs non-variable Hanken) is an explicit conditional with both branches specified, not a placeholder. ✓

**Type/name consistency:** New tokens `--vin-burgundy / -deep / --vin-beige / --vin-navy / --vin-navy-mid / --vin-plum` and `--vin-font-display / --vin-font-serif` are defined in Tasks 1–2 and used consistently in Tasks 2–5. `.vin-page`, `.vin-about__logo` class names match between markup and CSS steps. Task 4's grep enumerates exactly the removed tokens/values introduced earlier. ✓

**Logo-surface fallback (from spec):** The spec allowed adding a beige band if no light surface existed — the About section IS a light surface, so Task 5 uses it directly (no extra band needed). ✓
