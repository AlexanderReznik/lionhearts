# Sub-Plan 02 — Shared Components (Nav + Footer)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task.

**Goal:** Build the Nav and Footer components used on every page, and integrate them into BaseLayout. After this sub-plan, every page has the glassmorphism nav and the full footer.

**Visual reference:** `mockup-final.html` — nav and footer are identical across all tabs.

**Prerequisite:** Sub-plan 01 complete (`npm run build` passes).

---

### Task 1: Nav component

**Files:**
- Create: `src/components/Nav.astro`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Create Nav.astro**

```astro
---
// src/components/Nav.astro
const navLinks = [
  { label: 'Home',      href: '/' },
  { label: 'About',     href: '/about' },
  { label: 'Events',    href: '/events' },
  { label: 'Teams',     href: '/teams' },
  { label: 'Sponsors',  href: '/sponsorship' },
  { label: 'Contact',   href: '/contact' },
];

const current = Astro.url.pathname;
const isActive = (href: string) =>
  href === '/' ? current === '/' : current.startsWith(href);
---

<nav class="nav">
  <div class="nav__inner">
    <a href="/" class="nav__logo">
      <div class="nav__crest" aria-hidden="true">
        <!-- Replace SVG content with actual club crest when available -->
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="22" cy="22" r="22" fill="url(#crest-grad)"/>
          <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="22" fill="white">🦁</text>
          <defs>
            <radialGradient id="crest-grad" cx="40%" cy="35%">
              <stop offset="0%" stop-color="#0a2a6e"/>
              <stop offset="100%" stop-color="#0d1f4d"/>
            </radialGradient>
          </defs>
        </svg>
      </div>
      <div class="nav__name">
        <strong>Lionhearts</strong>
        <span>Volleyball Club</span>
      </div>
      <div class="nav__e2-badge">Shoreditch · E2</div>
    </a>

    <ul class="nav__links" role="list">
      {navLinks.map(link => (
        <li>
          <a href={link.href} class:list={['nav__link', { 'nav__link--active': isActive(link.href) }]}>
            {link.label}
          </a>
        </li>
      ))}
    </ul>

    <a href="/join" class="btn btn--primary nav__cta">Join Us</a>
  </div>
</nav>

<style>
  .nav {
    position: sticky;
    top: 0;
    z-index: 100;
    height: var(--nav-height);
    background: rgba(5, 10, 22, 0.88);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }

  .nav__inner {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 0 var(--page-px);
    height: 100%;
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .nav__logo {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: var(--color-text);
    flex-shrink: 0;
  }

  .nav__crest {
    border-radius: 50%;
    border: 2px solid rgba(0, 120, 255, 0.4);
    overflow: hidden;
    flex-shrink: 0;
  }

  .nav__name strong {
    display: block;
    font-weight: 900;
    font-size: 0.875rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    line-height: 1.2;
  }

  .nav__name span {
    display: block;
    font-size: 0.5625rem;
    color: var(--color-text-faint);
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .nav__e2-badge {
    background: rgba(0, 80, 220, 0.15);
    border: 1px solid rgba(0, 120, 255, 0.25);
    color: var(--color-highlight-1);
    font-size: 0.5625rem;
    font-weight: 800;
    letter-spacing: 2px;
    padding: 3px 9px;
    border-radius: 3px;
    text-transform: uppercase;
  }

  .nav__links {
    display: flex;
    list-style: none;
    gap: 2rem;
    flex: 1;
    justify-content: center;
  }

  .nav__link {
    color: var(--color-text-muted);
    text-decoration: none;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    transition: color 0.15s;
    padding: 4px 0;
  }

  .nav__link:hover,
  .nav__link--active {
    color: var(--color-text);
  }

  .nav__cta {
    flex-shrink: 0;
    font-size: 0.6875rem;
  }
</style>
```

- [ ] **Step 2: Add Nav to BaseLayout**

Replace `src/layouts/BaseLayout.astro`:

```astro
---
// src/layouts/BaseLayout.astro
import BaseHead from '../components/BaseHead.astro';
import Nav from '../components/Nav.astro';

interface Props {
  title: string;
  description: string;
  ogImage?: string;
  jsonLd?: object | object[];
}

const { title, description, ogImage, jsonLd } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <BaseHead
      title={title}
      description={description}
      ogImage={ogImage}
      jsonLd={jsonLd}
    />
  </head>
  <body>
    <Nav />
    <main>
      <slot />
    </main>
    <slot name="footer" />
  </body>
</html>
```

- [ ] **Step 3: Run dev and verify nav renders**

```bash
npm run dev
```

Open `http://localhost:4321` — verify nav is visible, sticky, glassmorphism effect, Shoreditch E2 badge, Join Us button.

- [ ] **Step 4: Commit**

```bash
git add src/components/Nav.astro src/layouts/BaseLayout.astro
git commit -m "feat: add glassmorphism Nav with E2 badge and active link state"
```

---

### Task 2: Footer component

**Files:**
- Create: `src/components/Footer.astro`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Create Footer.astro**

```astro
---
// src/components/Footer.astro
const year = new Date().getFullYear();

const clubLinks = [
  { label: 'About Us',          href: '/about' },
  { label: 'Meet Our Teams',    href: '/teams' },
  { label: 'Events & Fixtures', href: '/events' },
];

const involvedLinks = [
  { label: 'Join Us',        href: '/join' },
  { label: 'Open Sessions',  href: '/events' },
  { label: 'Sponsorship',    href: '/sponsorship' },
];

const contactLinks = [
  { label: 'allanzelion@gmail.com',  href: 'mailto:allanzelion@gmail.com' },
  { label: '@lionhearts_volleyball', href: 'https://instagram.com/lionhearts_volleyball' },
  { label: 'Shoreditch, E2 6NW',     href: 'https://maps.google.com/?q=Mulberry+Academy+Shoreditch' },
];
---

<footer class="footer">
  <div class="footer__inner">
    <div class="footer__brand">
      <div class="footer__crest">
        <svg width="40" height="40" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="22" cy="22" r="22" fill="url(#footer-crest-grad)"/>
          <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="20" fill="white">🦁</text>
          <defs>
            <radialGradient id="footer-crest-grad" cx="40%" cy="35%">
              <stop offset="0%" stop-color="#0a2a6e"/>
              <stop offset="100%" stop-color="#0d1f4d"/>
            </radialGradient>
          </defs>
        </svg>
        <strong>London Lionhearts VBC</strong>
      </div>
      <p class="footer__tagline">"Together We Roar."</p>
      <p class="footer__location">📍 <strong>Shoreditch, East London</strong></p>
      <address class="footer__address">
        Mulberry Academy Shoreditch<br />
        Gosset Street, E2 6NW
      </address>
      <div class="footer__socials">
        <a href="https://instagram.com/lionhearts_volleyball" class="footer__social-pill" target="_blank" rel="noopener">📷 Instagram</a>
        <a href="https://facebook.com/lionheartsvolleyball" class="footer__social-pill" target="_blank" rel="noopener">👍 Facebook</a>
        <a href="https://youtube.com/@londonlionheartsvolleyball5826" class="footer__social-pill" target="_blank" rel="noopener">▶ YouTube</a>
      </div>
    </div>

    <div class="footer__col">
      <h4>Club</h4>
      <ul role="list">
        {clubLinks.map(l => <li><a href={l.href}>{l.label}</a></li>)}
      </ul>
    </div>

    <div class="footer__col">
      <h4>Get Involved</h4>
      <ul role="list">
        {involvedLinks.map(l => <li><a href={l.href}>{l.label}</a></li>)}
      </ul>
    </div>

    <div class="footer__col">
      <h4>Contact</h4>
      <ul role="list">
        {contactLinks.map(l => <li><a href={l.href}>{l.label}</a></li>)}
      </ul>
    </div>
  </div>

  <div class="footer__bottom">
    <p>© {year} London Lionhearts Volleyball Club. All rights reserved.</p>
    <p class="footer__bottom-tagline">Together We Roar.</p>
  </div>
</footer>

<style>
  .footer {
    background: #03060f;
    border-top: 1px solid var(--color-border);
    padding: 52px var(--page-px) 28px;
  }

  .footer__inner {
    max-width: var(--max-width);
    margin: 0 auto;
    display: flex;
    gap: 48px;
    margin-bottom: 40px;
  }

  .footer__brand { flex: 1.4; }

  .footer__crest {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .footer__crest strong {
    font-weight: 900;
    font-size: 0.8125rem;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .footer__tagline {
    color: var(--color-text-faint);
    font-size: 0.8125rem;
    font-style: italic;
    margin-bottom: 6px;
  }

  .footer__location {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--color-text-faint);
    font-size: 0.6875rem;
    margin-bottom: 10px;
  }

  .footer__location strong { color: rgba(255,255,255,0.4); }

  .footer__address {
    color: rgba(255,255,255,0.2);
    font-size: 0.6875rem;
    line-height: 1.7;
    font-style: normal;
    margin-bottom: 16px;
  }

  .footer__socials {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .footer__social-pill {
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 5px 12px;
    font-size: 0.625rem;
    color: rgba(255,255,255,0.4);
    text-decoration: none;
    transition: border-color 0.15s, color 0.15s;
  }

  .footer__social-pill:hover {
    border-color: rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.7);
  }

  .footer__col { flex: 1; }

  .footer__col h4 {
    font-size: 0.5625rem;
    font-weight: 700;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    margin-bottom: 14px;
  }

  .footer__col ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .footer__col a {
    color: rgba(255,255,255,0.45);
    font-size: 0.75rem;
    text-decoration: none;
    transition: color 0.15s;
  }

  .footer__col a:hover { color: rgba(255,255,255,0.75); }

  .footer__bottom {
    max-width: var(--max-width);
    margin: 0 auto;
    border-top: 1px solid rgba(255,255,255,0.05);
    padding-top: 22px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer__bottom p {
    color: rgba(255,255,255,0.15);
    font-size: 0.6875rem;
  }

  .footer__bottom-tagline {
    font-style: italic;
  }
</style>
```

- [ ] **Step 2: Add Footer to BaseLayout**

Replace `src/layouts/BaseLayout.astro`:

```astro
---
// src/layouts/BaseLayout.astro
import BaseHead from '../components/BaseHead.astro';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';

interface Props {
  title: string;
  description: string;
  ogImage?: string;
  jsonLd?: object | object[];
}

const { title, description, ogImage, jsonLd } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <BaseHead
      title={title}
      description={description}
      ogImage={ogImage}
      jsonLd={jsonLd}
    />
  </head>
  <body>
    <Nav />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:4321` — verify footer renders: crest, tagline, location, address, social pills, three link columns, copyright.

- [ ] **Step 4: Run build to confirm no errors**

```bash
npm run build
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/Footer.astro src/layouts/BaseLayout.astro
git commit -m "feat: add Footer component with address, socials, and link columns"
```

---

### ✅ Sub-plan 02 complete

Every page now has Nav + Footer via BaseLayout. No page-level work needed for these components again.

**Next:** `plans/lionhearts/03-homepage.md`
