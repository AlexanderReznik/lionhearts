# Lionhearts Website — Owner To-Do

Everything that needs to happen before (and just after) launch. Code is done; these are the content, accounts, and configuration tasks only you can complete.

---

## 1. Set up the Join form (Formspree)

The contact form on `/join` is wired up but needs a real form ID.

1. Create a free account at [formspree.io](https://formspree.io)
2. Create a new form — name it "Join Lionhearts"
3. Copy the form ID from the form's dashboard (looks like `xabcdefg`)
4. Open `src/pages/join.astro` and replace `REPLACE_WITH_FORM_ID` with your ID:
   ```
   action="https://formspree.io/f/xabcdefg"
   ```
5. Submit a test entry and confirm the email arrives in your inbox

---

## 2. Team photos (9 photos needed)

### Where to put them
Drop files into `public/images/teams/`. Use these exact filenames:

| Team | Filename |
|---|---|
| Vinarius | `vinarius.jpg` |
| Cats | `cats.jpg` |
| Fury | `fury.jpg` |
| Beats | `beats.jpg` |
| Alpha | `alpha.jpg` |
| Predators | `predators.jpg` |
| Pride | `pride.jpg` |
| Roar | `roar.jpg` |
| Leo | `leo.jpg` |

### How they plug in
Open `src/data/teams.ts` and set the `image` field for each team:
```ts
{ name: 'Vinarius', image: '/images/teams/vinarius.jpg', ... }
```
The team cards will automatically show the photo once the path is set.

### Photo specs
- **Size:** 1280×720 px (16:9 landscape) recommended. 960×540 minimum.
- **Aspect:** **16:9** — the team card uses `aspect-ratio: 16/9` with `object-fit: cover`, so 4:3 photos will get the top + bottom cropped. Shoot or crop wide.
- **Format:** WebP preferred (~30% smaller). JPEG fine.
- **File size:** under 150 KB each.
- **Composition:** whole team visible, faces roughly centered, a little headroom — anything at the very top/bottom may get clipped by the card crop.
- Photos from a phone are fine — just resize and re-crop to 16:9 before dropping in.

> If you use WebP, change the file extensions to `.webp` and update the `image:` paths in `src/data/teams.ts` to match.

---

## 3. Vinarius logo (Sponsorship page)

The sponsor block on `/sponsorship` shows a grey placeholder where the logo should go.

1. Get a Vinarius logo file — PNG with transparent background is ideal, SVG also works
2. Drop it into `public/images/sponsors/vinarius.png`
3. Open `src/pages/sponsorship.astro` and set:
   ```ts
   logo: '/images/sponsors/vinarius.png'
   ```

---

## 4. OG image (social sharing preview)

This is the image that appears when the site is shared on WhatsApp, iMessage, Twitter, etc. There's a placeholder wired up but it needs a real image.

- **Size:** exactly 1200×630px
- **Format:** JPEG
- **Content:** club crest + "London Lionhearts VBC" + tagline on dark navy background
- **Save to:** `public/og-image.jpg`

A simple design in Canva using the club colours works well here.

---

## 5. Verify Volleyzone team links

The Events page has a "View on Volleyzone →" link for each team. The URLs need to be confirmed.

1. Go to [volleyzone.co.uk](https://volleyzone.co.uk)
2. Search for each Lionhearts team and open their page
3. Check the `?team=` value in the URL
4. Update the `volleyzoneSlug` for each team in `src/data/teams.ts`

---

## 6. Confirm team divisions

There is a note in the code to double-check the division listed for each team. Open `src/data/teams.ts` and verify the `division` field for all 9 teams matches the current season's competition structure (NVL Super League vs LVA division names).

---

## 7. Deploy to Vercel + custom domain

1. Push the repo to GitHub (if not already done)
2. Go to [vercel.com](https://vercel.com) → Add New Project → import the repo
3. Add any environment variables:
   - `GOOGLE_SHEET_ID` — only needed if using the live sessions Google Sheet (see item 8)
4. Once deployed, go to Project Settings → Domains
5. Add `lionheartsvolleyball.com` and follow Vercel's DNS instructions

---

## 8. Live session schedule via Google Sheets (recommended)

Both `/events` and the homepage "open sessions" strip read from a single Google Sheet. Edits to the sheet auto-trigger a site rebuild via a webhook, so updates appear within ~1 minute without a developer.

### 8a. Create the sheet

1. Create a Google Sheet with these column headers in row 1:
   - **Required:** `day`, `time`, `level`
   - **Optional:** `venue`, `price` (leave blank to inherit the club defaults: "Mulberry Academy Shoreditch" / "£8 cash / £10 card", set in `src/data/club.ts`)
2. One session per row. The common case is just 3 columns:

   | day | time | level |
   |---|---|---|
   | Monday | 7:00pm–9:00pm | All Levels |
   | Thursday | 7:00pm–9:00pm | All Levels |
   | Friday | 8:00pm–10:00pm | Intermediate / Advanced |

   Only fill the venue/price cells for one-offs that differ from the defaults, e.g. a summer beach session:

   | day | time | level | venue | price |
   |---|---|---|---|---|
   | Saturday | 10:00am–12:00pm | Beach | Hyde Park Beach Courts | £12 |

   - Use a real en-dash `–` in times (option-hyphen on Mac), not a plain `-` — Sheets sometimes auto-formats `-` as a date.
   - First tab only — only the leftmost tab is read.

3. **File → Share → Publish to web** → select **CSV** for the first tab → **Publish**.
4. Also set **Share → Anyone with the link → Viewer**.
5. Copy the sheet ID from the URL (the long string between `/d/` and `/edit`).

### 8b. Wire the ID into the site

1. Locally (optional, for testing): create `.env.local` in the project root with:
   ```
   GOOGLE_SHEET_ID=<paste-id-here>
   ```
   Then `npm run dev` and check `/events` and the homepage strip both reflect the sheet.
2. In Netlify/Vercel: project settings → **Environment Variables** → add `GOOGLE_SHEET_ID` with the same value.
3. Trigger a redeploy. From now on every build pulls live data.

### 8c. Auto-rebuild when the sheet is edited

This is what makes the schedule feel "live" without paying for an SSR plan.

**On Netlify/Vercel side:**
1. Netlify: Site → Build & deploy → Build hooks → **Add build hook** → copy the URL.
   Vercel: Project → Settings → Git → Deploy Hooks → **Create Hook** → copy the URL.

**On Google Sheets side:**
1. Open the sheet → **Extensions → Apps Script**.
2. Replace the default code with:
   ```js
   const BUILD_HOOK_URL = 'PASTE_YOUR_BUILD_HOOK_URL_HERE';

   function triggerDeploy() {
     UrlFetchApp.fetch(BUILD_HOOK_URL, { method: 'post', payload: '' });
   }
   ```
3. Save. Click **Triggers** (clock icon, left sidebar) → **Add Trigger**:
   - Function: `triggerDeploy`
   - Event source: **From spreadsheet**
   - Event type: **On change** (catches edits, row inserts, formula recalcs)
   - Failure notification: weekly is fine
4. Save. Google will ask for permissions — accept (it only needs URL fetch).

That's it. Edit the sheet → ~30s later Apps Script fires → Netlify/Vercel rebuilds → ~1 minute later the live site shows the new schedule.

### If you skip this step

The hardcoded fallback in `src/lib/sheets.ts` is used. Perfectly fine for launch; just edit that file when the schedule changes and redeploy.

---

## 9. Update Instagram follower count

The Contact page hardcodes `@lionhearts_volleyball · 2,104 followers`. Update this before launch:

- Open `src/pages/contact.astro`
- Find the `handle` field for Instagram and update the number

---

## 10. Overheard at Training tab (Google Sheet)

The "Overheard at Training" archive on the homepage reads from a second tab on the same Google Sheet you set up in item 8. Skip this and the section shows a single hardcoded fallback quote — fine for launch, easy to add later.

### 10a. Create the tab

1. Open the existing schedule sheet.
2. Click the `+` at the bottom-left to add a new tab. Rename it to **Overheard**.
3. In row 1 add these headers (case-insensitive):
   - `quote` (required) — the line itself, no surrounding quote marks (the site adds them)
   - `name` (required) — first name or however the person wants to be credited
   - `team` (optional) — e.g. "Men's Pride"; leave blank to show just the name
4. Add one row per quote. Rows where `quote` is blank are skipped silently, so you can leave gaps for organisation.

Example:

| quote | name | team |
|---|---|---|
| I just heard 3 lightning strikes and was stuck in the shed cause of hail storms, I'm not going beach | Tope | Men's Pride |
| Probably my favourite hummus | Sara | Women's Cats |

### 10b. Wire the tab's gid into the site

The "gid" is the numeric ID of the tab. Find it by clicking the Overheard tab and looking at the URL: `...#gid=987654321` — that number is the gid.

1. Locally: add to `.env.local`:
   ```
   GOOGLE_SHEET_GID_QUOTES=987654321
   ```
2. In Netlify/Vercel: add `GOOGLE_SHEET_GID_QUOTES` as an env var with the same value.
3. Trigger a redeploy.

The webhook from item 8c already covers this tab — onChange fires for edits to any tab in the sheet.

---

## 11. Homepage hero carousel images (4 photos needed)

The hero on the homepage cycles through 4 background images (currently all pointing at a placeholder). These are the most important photos on the site — they're the first thing every visitor sees.

### Where to put them

Drop files into `public/images/hero/`. Use these exact filenames:

| # | Slide label              | Filename                |
|---|--------------------------|-------------------------|
| 1 | SUPER LEAGUE 2025/26     | `01-super-league.webp`  |
| 2 | LVA PREMIER LEAGUE       | `02-lva-premier.webp`   |
| 3 | OPEN SESSIONS · SHOREDITCH E2 | `03-open-session.webp` |
| 4 | TOGETHER WE ROAR         | `04-community.webp`     |

(If you use JPEG, change extensions to `.jpg` and update the `image:` paths in `src/pages/index.astro` lines 14, 19, 24, 29 to match.)

### How they plug in

Open `src/pages/index.astro` and update the `image:` field for each slide:

```ts
const heroSlides = [
  { image: '/images/hero/01-super-league.webp', label: 'SUPER LEAGUE 2025/26', alt: '…' },
  …
];
```

### Photo specs

- **Size:** **1920×1200 px** (16:10 landscape) recommended. Bigger sources are fine if you've got them — Squoosh will resize.
- **Format:** **WebP** preferred at quality ~80. JPEG fine. (Don't use PNG — photos in PNG are huge.)
- **File size:** **under 400 KB each** is the target. At 1920×1200 WebP-80 this is comfortable for sports photos; if you can't get there, push the source down (1600×1000 is still plenty sharp) before lowering quality below ~75. Use [squoosh.app](https://squoosh.app) to compare.
- **Composition:**
  - The headline **"TOGETHER WE ROAR"** sits **bottom-left**. Don't put key subjects there — they'll get hidden behind text.
  - The bottom 40% is **darkened by a gradient overlay** for headline contrast. Don't worry about exposure at the bottom, just don't put the key action there.
  - The image gets **cropped differently on mobile vs desktop** (wide on desktop, tall on mobile). Subject should sit roughly **centered or upper-right** so neither crop loses them.
- **Content suggestions per slide** (match the labels above):
  1. Action shot of an NVL team playing — a hit, a block, a celebration
  2. The LVA Premier women's team — a moment from a match
  3. An open session at Mulberry — wide angle showing the gym, lots of people
  4. The whole club / a community moment — players hugging, lining up, mid-laugh

### What's there now

A single placeholder file (`/images/placeholder-hero.jpg`). Until real photos are added, the hero shows that same image on all 4 slides — fine for dev, not for launch.

---

## Image folder structure (for reference)

```
public/
  images/
    hero/
      01-super-league.webp
      02-lva-premier.webp
      03-open-session.webp
      04-community.webp
    teams/
      vinarius.jpg
      cats.jpg
      fury.jpg
      beats.jpg
      alpha.jpg
      predators.jpg
      pride.jpg
      roar.jpg
      leo.jpg
    sponsors/
      vinarius.png
  og-image.jpg
```
