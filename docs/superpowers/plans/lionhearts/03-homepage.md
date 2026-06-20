# Sub-Plan 03 — Homepage

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task.

**Goal:** Build all homepage sections as individual components, then assemble them into `src/pages/index.astro`. After this sub-plan the homepage is fully functional and visually matches the mockup.

**Visual reference:** `mockup-final.html` → Home tab.

**Prerequisite:** Sub-plans 01 and 02 complete.

---

### Task 1: Hero carousel

**Files:**
- Create: `src/components/Hero.astro`
- Create: `public/images/placeholder-hero.jpg`

- [ ] **Step 1: Create placeholder hero image**

```bash
which convert && convert -size 1920x1080 \
  gradient:'#0050e0-#050d1a' \
  public/images/placeholder-hero.jpg 2>/dev/null || \
  echo "⚠️  Add a placeholder image at public/images/placeholder-hero.jpg (any dark JPG)"
```

- [ ] **Step 2: Create Hero.astro**

```astro
---
// src/components/Hero.astro
interface Slide {
  image: string;   // public/ path e.g. "/images/hero-1.jpg"
  label: string;   // e.g. "SUPER LEAGUE 2025/26"
  alt: string;
}

interface Props {
  slides: Slide[];
}

const { slides } = Astro.props;
---

<section class="hero" aria-label="Club highlights carousel">
  <!-- Slides -->
  <div class="hero__slides">
    {slides.map((slide, i) => (
      <div
        class:list={['hero__slide', { 'hero__slide--active': i === 0 }]}
        style={`background-image: url(${slide.image})`}
        role="img"
        aria-label={slide.alt}
        data-index={i}
      />
    ))}
  </div>

  <!-- Decorative overlays -->
  <div class="hero__texture" aria-hidden="true"></div>
  <div class="hero__overlay" aria-hidden="true"></div>
  <div class="hero__accent" aria-hidden="true"></div>

  <!-- Content -->
  <div class="hero__content">
    <div class="hero__location">
      <span aria-hidden="true">📍</span>
      <strong>Shoreditch</strong>
      <span>· East London · Est. 1998</span>
    </div>

    <div class="hero__tag">NVL Super League · LVA Premier League</div>

    <h1 class="hero__headline">
      Together<span class="gradient-text">We Roar.</span>
    </h1>

    <p class="hero__sub">
      East London's volleyball club — competing from the NVL Super League to your first ever session.
    </p>

    <div class="hero__flags" aria-label="Players from around the world">
      <span aria-hidden="true">🇬🇧🇧🇷🇫🇷🇵🇹🇩🇪🇯🇵🇳🇬🇦🇺🇮🇹🇪🇸🇺🇸+</span>
      <p>Players from all over the world</p>
    </div>

    <div class="hero__ctas">
      <a href="/join" class="btn btn--primary">Join the Club</a>
      <a href="/teams" class="btn btn--ghost">Meet Our Teams →</a>
    </div>
  </div>

  <!-- Carousel label + dots -->
  <div class="hero__carousel-label" id="carousel-label" aria-live="polite">
    {slides[0] && `01 / ${String(slides.length).padStart(2,'0')} · ${slides[0].label}`}
  </div>

  <div class="hero__dots" role="tablist" aria-label="Carousel slides">
    {slides.map((_, i) => (
      <button
        class:list={['hero__dot', { 'hero__dot--active': i === 0 }]}
        role="tab"
        aria-selected={i === 0}
        aria-label={`Slide ${i + 1}`}
        data-slide={i}
      />
    ))}
  </div>
</section>

<style>
  .hero {
    height: 92vh;
    min-height: 620px;
    position: relative;
    display: flex;
    align-items: flex-end;
    overflow: hidden;
    background: var(--color-bg);
  }

  /* ── Slides ── */
  .hero__slides { position: absolute; inset: 0; }

  .hero__slide {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    opacity: 0;
    transition: opacity 0.9s ease;
    /* Fallback gradient when no image supplied */
    background-color: var(--color-bg);
  }

  .hero__slide--active { opacity: 1; }

  /* ── Overlays ── */
  .hero__texture {
    position: absolute; inset: 0; opacity: 0.025; pointer-events: none;
    background-image:
      repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(255,255,255,1) 18px, rgba(255,255,255,1) 19px),
      repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(255,255,255,1) 38px, rgba(255,255,255,1) 39px);
  }

  .hero__overlay {
    position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(to top, rgba(5,13,26,0.97) 0%, rgba(5,13,26,0.55) 40%, rgba(5,13,26,0.1) 100%);
  }

  .hero__accent {
    position: absolute; top: 0; right: 200px; bottom: 0; width: 1px; pointer-events: none;
    background: linear-gradient(to bottom, transparent, rgba(0,100,255,0.25), transparent);
    transform: skewX(-12deg);
  }

  /* ── Content ── */
  .hero__content {
    position: relative;
    z-index: 2;
    padding: 0 var(--page-px) 72px;
    max-width: 760px;
  }

  .hero__location {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    background: rgba(0,80,220,0.1);
    border: 1px solid rgba(0,120,255,0.2);
    border-radius: 4px;
    padding: 6px 14px;
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
  }

  .hero__location strong { color: #fff; }
  .hero__location span:last-child { color: var(--color-text-muted); }

  .hero__tag {
    display: inline-block;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 3px;
    padding: 4px 10px;
    font-size: 0.5625rem;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-bottom: 16px;
  }

  .hero__headline {
    font-size: clamp(3.25rem, 8vw, 6rem);
    font-weight: 900;
    line-height: 0.9;
    text-transform: uppercase;
    letter-spacing: -4px;
    margin-bottom: 20px;
  }

  .hero__headline .gradient-text { display: block; }

  .hero__sub {
    color: var(--color-text-muted);
    font-size: 0.9375rem;
    line-height: 1.65;
    margin-bottom: 16px;
    max-width: 460px;
  }

  .hero__flags {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 30px;
  }

  .hero__flags span { font-size: 1rem; letter-spacing: 2px; }

  .hero__flags p {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.35);
    font-style: italic;
  }

  .hero__ctas { display: flex; gap: 14px; align-items: center; }

  /* ── Carousel controls ── */
  .hero__carousel-label {
    position: absolute;
    bottom: 28px;
    left: var(--page-px);
    z-index: 3;
    color: rgba(255,255,255,0.25);
    font-size: 0.5625rem;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .hero__dots {
    position: absolute;
    bottom: 28px;
    right: var(--page-px);
    z-index: 3;
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .hero__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    border: none;
    padding: 0;
    transition: width 0.25s, background 0.25s, border-radius 0.25s;
  }

  .hero__dot--active {
    width: 24px;
    border-radius: 3px;
    background: var(--color-accent-to);
  }
</style>

<script>
  const slides = document.querySelectorAll<HTMLElement>('.hero__slide');
  const dots = document.querySelectorAll<HTMLButtonElement>('.hero__dot');
  const label = document.getElementById('carousel-label');
  const labels: string[] = [];

  // Collect slide labels from data attributes (set via SSR isn't possible for JS,
  // so we embed them as a data attribute on the section)
  const section = document.querySelector('.hero');
  const rawLabels = section?.getAttribute('data-labels') ?? '';
  const slideLabels = rawLabels ? rawLabels.split('||') : [];

  let current = 0;
  let timer: ReturnType<typeof setInterval>;

  function goTo(n: number) {
    slides[current].classList.remove('hero__slide--active');
    dots[current].classList.remove('hero__dot--active');
    dots[current].setAttribute('aria-selected', 'false');

    current = (n + slides.length) % slides.length;

    slides[current].classList.add('hero__slide--active');
    dots[current].classList.add('hero__dot--active');
    dots[current].setAttribute('aria-selected', 'true');

    if (label && slideLabels[current]) {
      label.textContent = `${String(current + 1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')} · ${slideLabels[current]}`;
    }
  }

  function startTimer() {
    timer = setInterval(() => goTo(current + 1), 5000);
  }

  function resetTimer() {
    clearInterval(timer);
    startTimer();
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); resetTimer(); });
  });

  // Pause on hover
  section?.addEventListener('mouseenter', () => clearInterval(timer));
  section?.addEventListener('mouseleave', startTimer);

  if (slides.length > 1) startTimer();
</script>
```

**Note on `data-labels`:** Pass slide labels as a joined string attribute on the `<section>`. Update the Hero component's `<section>` opening tag:

```astro
<section
  class="hero"
  aria-label="Club highlights carousel"
  data-labels={slides.map(s => s.label).join('||')}
>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Hero.astro public/images/
git commit -m "feat: add Hero carousel component with auto-advance and dot navigation"
```

---

### Task 2: StatsBar

**Files:**
- Create: `src/components/StatsBar.astro`

- [ ] **Step 1: Create StatsBar.astro**

```astro
---
// src/components/StatsBar.astro
const stats = [
  { value: '9×',         label: 'LVA Champions' },
  { value: '9',          label: 'Active Teams' },
  { value: 'Super\nLeague', label: 'NVL Club', small: true },
  { value: '200+',       label: 'Members*' },
  { value: 'Shoreditch\nE2', label: 'East London', small: true },
];
---

<div class="stats-bar" aria-label="Club statistics">
  {stats.map(stat => (
    <div class="stats-bar__stat">
      <div class:list={['stats-bar__value', { 'stats-bar__value--small': stat.small }]}>
        {stat.value.split('\n').map((line, i) => (
          <>{i > 0 && <br />}{line}</>
        ))}
      </div>
      <div class="stats-bar__label">{stat.label}</div>
    </div>
  ))}
</div>

<style>
  .stats-bar {
    background: linear-gradient(90deg, #0040cc, #0070f0, #0099ff);
    display: flex;
    border-left: 1px solid rgba(255,255,255,0.12);
  }

  .stats-bar__stat {
    flex: 1;
    padding: 22px 20px;
    border-right: 1px solid rgba(255,255,255,0.12);
    text-align: center;
  }

  .stats-bar__value {
    font-size: 1.875rem;
    font-weight: 900;
    color: #fff;
    letter-spacing: -1px;
    line-height: 1;
  }

  .stats-bar__value--small { font-size: 1.25rem; line-height: 1.1; }

  .stats-bar__label {
    font-size: 0.5rem;
    font-weight: 700;
    color: rgba(255,255,255,0.65);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 5px;
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StatsBar.astro
git commit -m "feat: add StatsBar component"
```

---

### Task 3: AboutIntro

**Files:**
- Create: `src/components/AboutIntro.astro`

- [ ] **Step 1: Create AboutIntro.astro**

```astro
---
// src/components/AboutIntro.astro
import { flags } from '../data/flags';
// Show a subset in the card
const cardFlags = flags.slice(0, 15);
---

<section class="about-intro">
  <div class="about-intro__inner container">

    <div class="about-intro__text">
      <p class="eyebrow">Est. 1998 · Shoreditch</p>
      <h2 class="about-intro__headline">
        The heartbeat<br />of <em>East London</em><br />volleyball.
      </h2>
      <p class="about-intro__body">
        Rooted in Shoreditch since 1998, Lionhearts has grown into one of London's most celebrated
        volleyball clubs — with 9 teams and a community of players from every corner of the world.
      </p>
      <a href="/about" class="about-intro__link">Our full story →</a>
    </div>

    <div class="about-intro__cards">
      <!-- Shoreditch location card -->
      <div class="about-intro__location-card">
        <div class="about-intro__pin" aria-hidden="true">📍</div>
        <div>
          <h3>Shoreditch, <span class="about-intro__postcode">E2</span></h3>
          <p>Mulberry Academy · East London<br />No other club owns this postcode.</p>
        </div>
      </div>

      <!-- International community card -->
      <div class="about-intro__intl-card">
        <h3>An international community</h3>
        <div class="about-intro__flags" aria-label="Flags of player nationalities">
          {cardFlags.map(f => (
            <span title={f.country} aria-label={f.country}>{f.emoji}</span>
          ))}
          <span aria-hidden="true">+</span>
        </div>
        <p>Players from all over the world — if you're new to London, you'll feel at home here.</p>
      </div>
    </div>

  </div>
</section>

<style>
  .about-intro {
    background: var(--color-bg);
    padding: var(--space-xl) var(--page-px);
  }

  .about-intro__inner {
    display: flex;
    gap: 64px;
    align-items: flex-start;
  }

  .about-intro__text { flex: 1; }

  .about-intro__headline {
    font-size: clamp(2rem, 4vw, 2.375rem);
    font-weight: 900;
    line-height: 1;
    text-transform: uppercase;
    letter-spacing: -1.5px;
    margin-bottom: 18px;
  }

  .about-intro__headline em { color: var(--color-accent-to); font-style: normal; }

  .about-intro__body {
    color: var(--color-text-muted);
    font-size: 0.9375rem;
    line-height: 1.75;
    margin-bottom: 24px;
  }

  .about-intro__link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--color-accent-to);
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    text-decoration: none;
  }

  .about-intro__link:hover { text-decoration: underline; }

  /* ── Cards ── */
  .about-intro__cards {
    width: 340px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .about-intro__location-card {
    background: linear-gradient(135deg, rgba(0,60,180,0.15), rgba(0,120,255,0.07));
    border: 1px solid var(--color-border-blue);
    border-radius: 12px;
    padding: 20px 22px;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .about-intro__pin {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    flex-shrink: 0;
    background: linear-gradient(135deg, var(--color-accent-from), var(--color-accent-to));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
  }

  .about-intro__location-card h3 { font-size: 0.875rem; font-weight: 800; margin-bottom: 2px; }
  .about-intro__location-card p { font-size: 0.6875rem; color: var(--color-text-muted); line-height: 1.5; }
  .about-intro__postcode { color: var(--color-highlight-1); font-weight: 700; }

  .about-intro__intl-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 20px 22px;
  }

  .about-intro__intl-card h3 { font-size: 0.8125rem; font-weight: 700; margin-bottom: 10px; }

  .about-intro__flags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
    font-size: 1.25rem;
    line-height: 1;
  }

  .about-intro__intl-card p { font-size: 0.6875rem; color: rgba(255,255,255,0.35); line-height: 1.5; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AboutIntro.astro
git commit -m "feat: add AboutIntro component with location and international cards"
```

---

### Task 4: CommunitySection

**Files:**
- Create: `src/components/CommunitySection.astro`

- [ ] **Step 1: Create CommunitySection.astro**

```astro
---
// src/components/CommunitySection.astro
import { flags } from '../data/flags';
---

<section class="community">
  <div class="community__inner container">

    <div class="community__header">
      <div>
        <p class="eyebrow">Our Community</p>
        <h2 class="community__headline">
          Volleyball brings<br />the <em>world</em> to E2.
        </h2>
      </div>
      <p class="community__sub">
        New to London? Looking for your people? You've found us.<br />
        Every flag below was added by a club member.
      </p>
    </div>

    <!-- Flag mosaic -->
    <div class="community__mosaic" aria-label="Flags representing club member nationalities">
      {flags.map(f => (
        <span class="community__flag" title={f.country} aria-label={f.country}>{f.emoji}</span>
      ))}
      <!-- Phase 2 placeholder -->
      <div class="community__add-flag" title="Coming soon: submit your flag" aria-hidden="true">+</div>
    </div>

    <div class="community__divider" aria-hidden="true">
      <div></div>
      <span>Every flag added by a club member</span>
      <div></div>
    </div>

    <!-- Member quote -->
    <blockquote class="community__quote">
      <p>
        "I just heard 3 lightning strikes and was stuck in the shed cause of hail storms,
        I'm not going beach"
      </p>
      <footer>
        — <cite>Babatope Oscar Alabi</cite>
        <span class="community__quote-note">(placeholder — replace before launch)</span>
      </footer>
    </blockquote>

  </div>
</section>

<style>
  .community {
    background: var(--color-surface-3);
    padding: var(--space-xl) var(--page-px);
    border-top: 1px solid rgba(255,255,255,0.05);
    position: relative;
    overflow: hidden;
  }

  .community::before {
    content: '';
    position: absolute;
    top: -100px; right: -100px;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(0,70,200,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .community__inner { position: relative; }

  .community__header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 40px;
    gap: 32px;
  }

  .community__headline {
    font-size: clamp(2rem, 4vw, 2.5rem);
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -1.5px;
    line-height: 1;
    margin-top: 8px;
  }

  .community__headline em { color: var(--color-accent-to); font-style: normal; }

  .community__sub {
    color: var(--color-text-faint);
    font-size: 0.8125rem;
    max-width: 280px;
    text-align: right;
    line-height: 1.6;
  }

  /* ── Mosaic ── */
  .community__mosaic {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    margin-bottom: 32px;
    padding: 28px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 14px;
  }

  .community__flag {
    font-size: 1.875rem;
    line-height: 1;
    cursor: default;
    transition: transform 0.15s;
  }

  .community__flag:hover { transform: scale(1.15); }

  .community__add-flag {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 10px;
    border: 2px dashed rgba(0,120,255,0.3);
    background: rgba(0,80,220,0.06);
    color: rgba(0,150,255,0.5);
    font-size: 1.25rem;
    cursor: pointer;
    flex-shrink: 0;
    margin-left: 6px;
  }

  /* ── Divider ── */
  .community__divider {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
  }

  .community__divider div {
    height: 1px;
    flex: 1;
    background: rgba(255,255,255,0.05);
  }

  .community__divider span {
    font-size: 0.5625rem;
    color: rgba(255,255,255,0.2);
    letter-spacing: 2px;
    text-transform: uppercase;
    white-space: nowrap;
  }

  /* ── Quote ── */
  .community__quote {
    background: linear-gradient(135deg, rgba(0,60,180,0.1), rgba(0,120,255,0.05));
    border-left: 3px solid #0070ff;
    border-radius: 0 12px 12px 0;
    padding: 24px 28px;
  }

  .community__quote p {
    font-size: 1.0625rem;
    color: rgba(255,255,255,0.7);
    line-height: 1.6;
    font-style: italic;
    margin-bottom: 12px;
  }

  .community__quote footer {
    font-size: 0.6875rem;
    color: var(--color-text-faint);
    font-weight: 600;
  }

  .community__quote-note {
    color: rgba(255,255,255,0.15);
    font-style: italic;
    margin-left: 8px;
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CommunitySection.astro
git commit -m "feat: add CommunitySection with flag mosaic and member quote"
```

---

### Task 5: JoinCTA, SponsorsSection, InstagramFeed

**Files:**
- Create: `src/components/JoinCTA.astro`
- Create: `src/components/SponsorsSection.astro`
- Create: `src/components/InstagramFeed.astro`

- [ ] **Step 1: Create JoinCTA.astro**

```astro
---
// src/components/JoinCTA.astro
---

<section class="join-cta" aria-label="Join the club">
  <div class="join-cta__inner">
    <div class="join-cta__copy">
      <p class="join-cta__kicker">Shoreditch · All Levels · All Backgrounds</p>
      <h2 class="join-cta__headline">Ready<br />to play?</h2>
      <p class="join-cta__sub">Open sessions 3× a week. No experience needed. New to London? You'll fit right in.</p>
      <p class="join-cta__location">
        📍 <span>Mulberry Academy, Shoreditch E2</span>
        · Short walk from Bethnal Green, Shoreditch High Street or Hoxton stations
      </p>
    </div>
    <div class="join-cta__actions">
      <a href="/join" class="btn btn--white">Join the Club</a>
      <a href="/events" class="btn btn--outline-white">Open Sessions</a>
    </div>
  </div>
</section>

<style>
  .join-cta { background: var(--color-bg); padding: 0 var(--page-px) var(--space-xl); }

  .join-cta__inner {
    background: linear-gradient(135deg, #0030a0 0%, #0050d0 50%, #0070e8 100%);
    border-radius: 14px;
    padding: 64px;
    overflow: hidden;
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 48px;
  }

  .join-cta__inner::after {
    content: '';
    position: absolute;
    top: -80px; right: -80px;
    width: 350px; height: 350px;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
    pointer-events: none;
  }

  .join-cta__copy { position: relative; }

  .join-cta__kicker {
    font-size: 0.5625rem;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    margin-bottom: 10px;
  }

  .join-cta__headline {
    font-size: 2.5rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -2px;
    line-height: 0.9;
    margin-bottom: 10px;
  }

  .join-cta__sub {
    color: rgba(255,255,255,0.65);
    font-size: 0.875rem;
    margin-bottom: 8px;
  }

  .join-cta__location {
    display: flex;
    align-items: center;
    gap: 6px;
    color: rgba(255,255,255,0.4);
    font-size: 0.6875rem;
    flex-wrap: wrap;
  }

  .join-cta__location span { color: #80c8ff; font-weight: 600; }

  .join-cta__actions {
    display: flex;
    gap: 12px;
    position: relative;
    flex-shrink: 0;
  }
</style>
```

- [ ] **Step 2: Create SponsorsSection.astro**

```astro
---
// src/components/SponsorsSection.astro
// TODO: Replace placeholder values with actual sponsor data from client
const sponsor = {
  name:        'Title Sponsor',         // ← replace
  description: 'Sponsor description',  // ← replace
  url:         '#',                    // ← replace
  logo:        null,                   // ← replace with '/images/sponsor-logo.svg'
};
---

<section class="sponsors" aria-labelledby="sponsors-heading">
  <p id="sponsors-heading" class="sponsors__eyebrow">Proudly supported by</p>

  <div class="sponsors__title-card">
    <div>
      <span class="sponsors__badge">Title Sponsor</span>
      <div class="sponsors__logo" aria-label={`${sponsor.name} logo`}>
        {sponsor.logo
          ? <img src={sponsor.logo} alt={`${sponsor.name} logo`} />
          : <span class="sponsors__logo-placeholder">Logo placeholder</span>
        }
      </div>
    </div>
    <div class="sponsors__meta">
      <p>Proudly supporting<br />Lionhearts VBC</p>
      <a href={sponsor.url} class="sponsors__link" target="_blank" rel="noopener">
        View sponsor page →
      </a>
    </div>
  </div>
</section>

<style>
  .sponsors {
    padding: 64px var(--page-px);
    border-top: 1px solid var(--color-border);
  }

  .sponsors__eyebrow {
    text-align: center;
    color: rgba(255,255,255,0.2);
    font-size: 0.5625rem;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 28px;
  }

  .sponsors__title-card {
    max-width: 520px;
    margin: 0 auto;
    background: linear-gradient(135deg, rgba(0,70,200,0.12), rgba(0,140,255,0.06));
    border: 1px solid rgba(0,100,220,0.25);
    border-radius: 12px;
    padding: 28px 36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .sponsors__badge {
    background: linear-gradient(90deg, var(--color-accent-from), var(--color-accent-to));
    color: #fff;
    font-size: 0.5rem;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 20px;
    margin-bottom: 10px;
    display: inline-block;
  }

  .sponsors__logo { width: 120px; height: 36px; }

  .sponsors__logo img { width: 100%; height: 100%; object-fit: contain; }

  .sponsors__logo-placeholder {
    display: flex;
    width: 120px;
    height: 36px;
    background: rgba(255,255,255,0.15);
    border-radius: 4px;
    align-items: center;
    justify-content: center;
    font-size: 0.625rem;
    color: rgba(255,255,255,0.3);
  }

  .sponsors__meta { color: rgba(255,255,255,0.3); font-size: 0.6875rem; text-align: right; line-height: 1.6; }

  .sponsors__link {
    color: var(--color-accent-to);
    font-size: 0.5625rem;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    text-decoration: none;
    display: block;
    margin-top: 4px;
  }
</style>
```

- [ ] **Step 3: Create InstagramFeed.astro**

> **Superseded — build-time Behold JSON feed.** InstagramFeed no longer uses the
> client-side `<behold-widget>` embed. It now fetches Behold's JSON feed at build
> time (`src/lib/behold.ts`) and renders a static, site-native 6-post grid
> (light/dark, 2-col on mobile, caption-on-hover) with a "follow us" fallback
> panel when the feed is empty or `BEHOLD_FEED_ID` is unset. See
> `docs/superpowers/specs/2026-06-20-instagram-behold-json-design.md` and
> `docs/superpowers/plans/2026-06-20-instagram-behold-json.md` for the current
> implementation. The old embed code that was here has been removed.

- [ ] **Step 4: Commit**

```bash
git add src/components/JoinCTA.astro src/components/SponsorsSection.astro src/components/InstagramFeed.astro
git commit -m "feat: add JoinCTA, SponsorsSection, and InstagramFeed components"
```

---

### Task 6: Assemble the homepage

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write index.astro with SportsOrganization JSON-LD**

```astro
---
// src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import StatsBar from '../components/StatsBar.astro';
import AboutIntro from '../components/AboutIntro.astro';
import CommunitySection from '../components/CommunitySection.astro';
import JoinCTA from '../components/JoinCTA.astro';
import SponsorsSection from '../components/SponsorsSection.astro';
import InstagramFeed from '../components/InstagramFeed.astro';

const heroSlides = [
  {
    image: '/images/placeholder-hero.jpg',
    label: 'SUPER LEAGUE 2025/26',
    alt: 'Lionhearts players in action at the NVL Super League',
  },
  {
    image: '/images/placeholder-hero.jpg',
    label: 'LVA PREMIER LEAGUE',
    alt: 'Lionhearts women celebrating a win',
  },
  {
    image: '/images/placeholder-hero.jpg',
    label: 'OPEN SESSIONS · SHOREDITCH E2',
    alt: 'Open session at Mulberry Academy Shoreditch',
  },
  {
    image: '/images/placeholder-hero.jpg',
    label: 'TOGETHER WE ROAR',
    alt: 'Lionhearts club community',
  },
];

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'SportsOrganization',
  name: 'London Lionhearts Volleyball Club',
  url: 'https://lionheartsvolleyball.com',
  logo: 'https://lionheartsvolleyball.com/images/og-default.jpg',
  sameAs: [
    'https://www.instagram.com/lionhearts_volleyball/',
    'https://www.facebook.com/lionheartsvolleyball',
    'https://www.youtube.com/@londonlionheartsvolleyball5826',
  ],
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Gosset Street',
    addressLocality: 'London',
    postalCode: 'E2 6NW',
    addressCountry: 'GB',
  },
  sport: 'Volleyball',
  foundingDate: '1998',
  location: {
    '@type': 'Place',
    name: 'Mulberry Academy Shoreditch',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Gosset Street',
      addressLocality: 'London',
      postalCode: 'E2 6NW',
      addressCountry: 'GB',
    },
  },
};
---

<BaseLayout
  title="London Lionhearts Volleyball Club — Shoreditch, East London"
  description="East London's volleyball club — competing from the NVL Super League to your first ever session. Open sessions 3× a week at Mulberry Academy, Shoreditch E2."
  jsonLd={orgSchema}
>
  <Hero slides={heroSlides} />
  <StatsBar />
  <AboutIntro />
  <CommunitySection />
  <JoinCTA />
  <SponsorsSection />
  <InstagramFeed />
</BaseLayout>
```

- [ ] **Step 2: Run dev and verify full homepage**

```bash
npm run dev
```

Open `http://localhost:4321`. Walk through every section:
- [ ] Nav: sticky, glassmorphism, E2 badge, Join Us button
- [ ] Hero: headline renders, carousel dots visible, flag strip present, CTAs link correctly
- [ ] Stats bar: 9×, 9 teams, Super League, 200+, Shoreditch E2
- [ ] About intro: eyebrow, headline with blue "East London", two cards
- [ ] Community: flag mosaic, divider, Babatope quote
- [ ] Join CTA: correct location text (no "5 min")
- [ ] Sponsors: placeholder renders without error
- [ ] Instagram: placeholder grid visible
- [ ] Footer: all links, address, socials, copyright year

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: clean build, no TypeScript errors, `dist/index.html` generated.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: assemble homepage with all sections and SportsOrganization JSON-LD"
```

---

### ✅ Sub-plan 03 complete

The homepage is fully built. `npm run build` passes. All components are in place for reuse across inner pages.

**Next:** `plans/lionhearts/04-about.md` through `09-contact.md` (can run in parallel)
