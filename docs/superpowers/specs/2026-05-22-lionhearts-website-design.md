# Lionhearts Volleyball Club — Website Design Spec
**Date:** 2026-05-22  
**Status:** Approved

---

## 1. Project Overview

A brand-new website for London Lionhearts Volleyball Club, replacing the existing basic WordPress site at lionheartsvolleyball.com. The primary goal is a modern, visually striking, advertising-quality frontend that positions Lionhearts as the premier volleyball club in East London.

**Tech stack:** Astro (static site generator, no CMS for Phase 1)  
**Hosting:** TBD (Netlify or Vercel recommended)

---

## 2. Brand & Visual Identity

### Colour palette
- **Primary background:** Near-black navy `#050d1a`
- **Surface:** Dark blue `#0a0e1a`, `#0a1628`
- **Accent gradient:** `#0050e0` → `#0090ff` (electric blue)
- **Text:** White `#ffffff`, muted `rgba(255,255,255,0.5)`
- **Highlights:** `#4da8ff`, `#00c2ff`

### Typography
- Font: System sans-serif stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI'`)
- Headlines: 900 weight, uppercase, tight letter-spacing (-2px to -4px)
- Style derived from Instagram post graphics: bold, impactful, high-contrast

### Design language
- Dark navy base, electric blue gradient accents
- Bold uppercase heavy typography throughout
- Glassmorphism navbar (frosted glass, backdrop-blur)
- Graphic style mirrors the club's existing Instagram posts (match announcement graphics, bold overlaid text)
- Diagonal accent lines as subtle design elements

### Key brand positioning
1. **East London / Shoreditch identity** — "Shoreditch · E2" badge in nav; "The heartbeat of East London volleyball" as About headline; postcode referenced throughout. No other London club owns this territory.
2. **International community** — Flags prominently displayed across homepage and About page; copy speaks directly to expats and newcomers to London.

---

## 3. Site Structure — 7 Pages

| Page | Purpose |
|------|---------|
| Home | Hub page — hero, stats, about intro, join CTA, sponsors, Instagram feed |
| About Us | Club history, founding story, values (Inclusive · Competitive · Community) |
| Events & Fixtures | Open sessions (Google Sheets) + league fixture deep links (Volleyzone) |
| Meet Our Teams | 9-team grid with photo, name, division, achievement badges |
| Sponsorship | Title sponsor profile + "Become a Sponsor" pitch |
| Join Us | Three pathways to get involved |
| Contact | Contact cards, location block, social links |

---

## 4. Homepage — Section by Section

**Flow:** Nav → Hero Carousel → Stats Bar → About Intro → Community Section → Join CTA → Sponsors → Instagram Feed → Footer

### Navigation
- Sticky, frosted-glass (`backdrop-filter: blur`)
- Club crest (circular navy badge, lion icon) + "Lionhearts / Volleyball Club"
- **"Shoreditch · E2" badge** next to logo
- Links: Home · About · Events · Teams · Sponsors · Contact
- "Join Us" CTA button (blue gradient) at right edge

### Hero — Full-screen Photo Carousel
- 90vh height, dark navy base
- Rotating action photos from club (provided by client)
- Subtle brick-pattern texture overlay (nods to Shoreditch's urban character)
- Gradient fade to near-black at bottom
- **Location lockup above headline:** `📍 Shoreditch · East London · Est. 1998`
- **Headline:** "Together / We Roar." (900 weight, "We Roar." in blue gradient)
- **Tag:** "NVL Super League · LVA Premier League"
- **Sub-headline:** "East London's volleyball club — competing from the NVL Super League to your first ever session."
- **Flag strip:** Row of 10+ national flags + "Players from all over the world" (italic)
- **CTAs:** "Join the Club" (primary) + "Meet Our Teams →" (ghost)
- Carousel dots (bottom right) + slide label e.g. "01/04 · SUPER LEAGUE 2025/26" (bottom left)

### Stats Bar
Full-width blue gradient strip with 5 stats:
- 9× LVA Champions
- 9 Active Teams
- Super League (NVL Club)
- 200+ Members *(placeholder — to be confirmed)*
- Shoreditch E2 / East London

### About Introduction
- Left: eyebrow "Est. 1998 · Shoreditch", headline "The heartbeat of East London volleyball.", body copy, "Our full story →" link
- Right: Two cards stacked:
  - **Shoreditch location card** — pin icon, "Shoreditch E2", "Mulberry Academy · East London · No other club owns this postcode."
  - **International community card** — flag grid (placeholder flags), "Players from all over the world — if you're new to London, you'll feel at home here."

### Community Section
- Standalone full-width section
- Headline: "Volleyball brings the world to E2."
- Sub: "New to London? Looking for your people? You've found us. Every flag below was added by a club member."
- **Flag mosaic** — grid of emoji flags, community-submitted (see Phase 2)
- **"+" placeholder** at end of mosaic (dashed border) hints at Phase 2 submit feature
- Separator line: "Every flag added by a club member"
- **Member quote** (italic): "I just heard 3 lightning strikes and was stuck in the shed cause of hail storms, I'm not going beach" — Babatope Oscar Alabi *(placeholder — replace with final quote before launch)*

### Join Us CTA Banner
- Full-width dark blue gradient card
- Headline: "Ready to play?"
- Sub: "Open sessions 3× a week. No experience needed. New to London? You'll fit right in."
- Location note: "📍 Mulberry Academy, Shoreditch E2 · Short walk from Bethnal Green, Shoreditch High Street or Hoxton stations"
- CTAs: "Join the Club" (white) + "Open Sessions" (outline)

### Sponsors Section
- "Proudly supported by" eyebrow
- **Title sponsor card** — badge, logo placeholder, link to sponsor page
- Partner strip below (auto-scrolling marquee for future partners)

### Instagram Feed
- "@lionhearts_volleyball" headline
- 3-column grid of 5–6 posts (styled to match their actual post types: session graphics, fixture announcements, reels, celebration photos)
- "View on Instagram →" link

### Footer
- Club crest + "London Lionhearts VBC"
- "Together We Roar." tagline (italic)
- "📍 Shoreditch, East London" location
- Address: Mulberry Academy Shoreditch, Gosset Street, E2 6NW
- Social pills: Instagram · Facebook · YouTube
- Three link columns: Club / Get Involved / Contact
- Copyright line

---

## 5. Inner Pages

### About Us
- Page hero: "About Us" headline
- Two-column layout: team photo block + founding story text
- Club history: founded 1998 by Alvin Spencer, led by Allan Mungroo since 2008
- Three values row: Inclusive · Competitive · Community

### Events & Fixtures
**Data architecture (Hybrid approach):**
- **Open sessions** — sourced from a Google Sheet (editable by non-developers). Fields: day, time, level, venue, price. Fetched at Astro build time via Google Sheets JSON API.
- **League fixtures/results** — deep links to Volleyzone per team, pre-filtered by team. Each team card links to `competitions.volleyzone.co.uk/fixture-and-results/lva/` with their team selected.
- **Phase 2:** Investigate Volleyzone's AJAX endpoints for automated fixture fetching into the site.

**Page layout:**
- Open sessions box at top (always visible, most relevant for casual visitors)
- Session cards: Mon & Thu 7–9pm (All levels) · Fri 8–10pm (Intermediate/Advanced) · Venue/price card
- Filter pills: All · Women's · Men's · NVL · LVA
- Fixture/result cards per team (date badge, teams, venue, competition tag)
- Each team section has a "View full schedule on Volleyzone →" link

### Meet Our Teams
3×3 grid (9 teams total). Each card:
- Team photo (placeholder until photos provided)
- Gender tag (Women's / Men's)
- Team name:
  - Women's (4): Vinarius, Cats, Fury, Beats
  - Men's (5): Alpha, Predators, Pride, Roar, Leo
- Division
- Achievement badge where applicable (e.g., "⚡ Super League", "🥇 Div 1 Champions")

### Sponsorship
- Title sponsor hero card (large logo, description, link to their website)
- "Become a Sponsor" blue gradient banner with "Get in Touch" CTA
- Six sponsorship perks grid: Social Media Exposure · Website Presence · Kit Branding · Event Presence · Champion Association · Community Reach

### Join Us
**Page headline:** "Come Play With Us" — welcoming tone throughout

Three pathways (in this order, lowest-barrier first):
1. **🏐 Come to an Open Session** (featured/primary) — "Just show up and play. No booking, no commitment." Includes inline session schedule. CTA: "See Full Schedule"
2. **📷 Say Hi on Instagram** — "Drop us a DM — we love hearing from new people." Link to @lionhearts_volleyball
3. **✉️ Tell Us About Yourself** — "Want us to find the right fit for you?" Links down to form

**Form fields:** First name · Last name · Email · Phone (optional) · Position (dropdown, includes "Not sure yet") · Experience level (Beginner → Competitive) · Free text ("Anything else?")
**Submit note:** "We'll get back to you within a few days. In a rush? DM us on Instagram for a faster response."

### Contact
- Three contact cards: Email · Instagram DM ("Fastest Response") · Come to a Session
- Location block: address + session schedule left, stylised map pin + "Open in Google Maps" button right
- Social row: Instagram · Facebook · YouTube cards

---

## 6. Phase 2 Features (not in initial build)

| Feature | Description |
|---------|-------------|
| **Flag submission** | Players submit their country via a simple form. Admin approves. Flag appears in the Community section on the homepage. Turns the flag mosaic into a living, community-built element. |
| **Volleyzone auto-sync** | Investigate Volleyzone's AJAX endpoints to automatically pull fixtures/results for all Lionhearts teams at build time, removing the need for Volleyzone deep links. |
| **CMS integration** | Add a headless CMS (e.g., Sanity, Contentful) to allow non-developers to update team info, news, and events without code changes. |

---

## 7. Content Requirements (from client)

The following content is needed before or during development:

- [ ] High-quality action photos for hero carousel (4–6 images)
- [ ] Video clip for potential future hero video option
- [ ] Club crest / logo in SVG format
- [ ] Title sponsor: name, logo, description, website URL
- [x] Team names confirmed: Women's — Vinarius, Cats, Fury, Beats; Men's — Alpha, Predators, Pride, Roar, Leo (9 teams total)
- [ ] Team photos for Meet Our Teams grid (9 photos)
- [ ] Open sessions schedule (confirmed: Mon/Thu 7–9pm all levels, Fri 8–10pm intermediate/advanced)
- [ ] Actual member quote for Community section (or approval to use placeholder)
- [ ] Contact email address (currently allanzelion@gmail.com — confirm if this should be public)
- [ ] Google Sheet created and shared for events/fixtures management
- [ ] Confirm "200+ Members" stat is accurate (used in stats bar)
- [x] Walking distance: "short walk from Bethnal Green, Shoreditch High Street or Hoxton stations" (no specific time stated)

---

## 8. Technical Notes

- **Framework:** Astro — outputs static HTML, zero JS by default, components for reuse
- **Styling:** Vanilla CSS (CSS custom properties for design tokens)
- **Instagram embed:** **Behold.so** (free tier: 25 posts, refreshes every 24h, small Behold badge; upgrade ~$8/mo to remove). Fallback: hardcode 6 static post images with "View on Instagram →" link — zero cost, zero maintenance, but not live. Meta's own API is not available to new apps.
- **Forms (Join Us / Contact):** Netlify Forms or Formspree — no backend required, submissions arrive by email
- **Google Sheets data fetch:** Sheets published as CSV/JSON, fetched at build time via Astro's `getStaticProps`-equivalent
- **Hosting:** Netlify or Vercel (both have free tiers, support Astro out of the box)
- **No CMS** in Phase 1 — content changes require a code edit and redeploy (5–10 min process)

---

## 9. SEO & Sitemap

### Per-page metadata
Every page includes a `<BaseHead>` component that outputs:
- `<title>` — page-specific title, pattern: `"Page Name | London Lionhearts Volleyball Club"`
- `<meta name="description">` — unique 150-160 char description per page
- `<link rel="canonical">` — absolute URL for each page
- Open Graph tags: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
- Twitter card: `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`

Default OG image: a branded card (club crest + "London Lionhearts Volleyball Club" on dark navy), used as fallback for all pages without a specific image.

### Sitemap
- Generated automatically at build time via Astro's `@astrojs/sitemap` integration
- Output: `/sitemap-index.xml` referencing `/sitemap-0.xml`
- All 7 pages included; no pages excluded

### robots.txt
- `/public/robots.txt` — allow all crawlers, point to sitemap URL

### Structured data (JSON-LD)
- `SportsOrganization` schema on homepage and About page:
  - `name`: "London Lionhearts Volleyball Club"
  - `url`, `logo`, `sameAs` (Instagram, Facebook, YouTube)
  - `address`: Mulberry Academy Shoreditch, Gosset Street, E2 6NW
  - `sport`: "Volleyball"
- `Event` + `Schedule` schema on Events & Fixtures page for recurring open sessions. Recurring events require `eventSchedule` with `@type: Schedule` (using `byDay`, `startTime`, `endTime`, `repeatFrequency`) rather than a plain `Event` type — this is what Google needs to surface them correctly in event search results.

### Per-page SEO targets

| Page | Title | Description focus |
|------|-------|-------------------|
| Home | London Lionhearts Volleyball Club — Shoreditch, East London | Club overview, East London identity, join CTA |
| About Us | About Us · London Lionhearts VBC | History, founding 1998, Alvin Spencer / Allan Mungroo |
| Events & Fixtures | Sessions & Fixtures · London Lionhearts VBC | Open sessions Mon/Thu/Fri, league fixtures |
| Meet Our Teams | Our Teams · London Lionhearts VBC | 9 teams, NVL Super League, LVA |
| Sponsorship | Sponsor London Lionhearts VBC | Sponsorship opportunities, East London reach |
| Join Us | Join London Lionhearts Volleyball Club | How to join, open sessions, no experience needed |
| Contact | Contact · London Lionhearts VBC | Location, email, social, Mulberry Academy E2 |
