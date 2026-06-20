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

The hero on the homepage cycles through 4 background images (currently all pointing at the same placeholder). These are the most important photos on the site — they're the first thing every visitor sees.

The hero uses Astro's `<Picture>` component, which means: **you supply one big source per slide and the build generates a responsive srcset** (AVIF + WebP + JPEG, at 640 / 960 / 1280 / 1920 / 2560 widths). The browser downloads only the size + format it actually needs. So you don't need to compress yourself — give it the original.

### Where to put them

Drop the source files into **`src/assets/hero/`** (NOT `public/`). Suggested filenames:

| # | Slide label              | Filename                |
|---|--------------------------|-------------------------|
| 1 | SUPER LEAGUE 2025/26     | `01-super-league.jpg`   |
| 2 | LVA PREMIER LEAGUE       | `02-lva-premier.jpg`    |
| 3 | OPEN SESSIONS · SHOREDITCH E2 | `03-open-session.jpg`   |
| 4 | TOGETHER WE ROAR         | `04-community.jpg`      |

### How they plug in

Open `src/pages/index.astro`. Near the top you'll see commented-out import lines — uncomment them and remove the placeholder import:

```ts
// import heroPlaceholder from '../assets/hero/placeholder.jpg';   ← delete this
import heroSuperLeague from '../assets/hero/01-super-league.jpg';
import heroLvaPremier from '../assets/hero/02-lva-premier.jpg';
import heroOpenSession from '../assets/hero/03-open-session.jpg';
import heroCommunity   from '../assets/hero/04-community.jpg';
```

Then update each slide's `image:` field to point at the right import (the line comments already say which goes where):

```ts
const heroSlides = [
  { image: heroSuperLeague, label: 'SUPER LEAGUE 2025/26', alt: '…' },
  { image: heroLvaPremier,  label: 'LVA PREMIER LEAGUE',    alt: '…' },
  …
];
```

Build will fail loudly if a path is wrong — that's a feature, not a bug.

### Photo specs

- **Source size:** **2400–3840 px wide** is ideal. Astro generates smaller variants automatically; it won't upscale, so the source should be at least as wide as your largest expected display.
- **Aspect:** **16:10 landscape** preferred (e.g. 3200×2000). Composition matters more than exact ratio.
- **Format:** **JPEG** at quality 85–95 is best as a source — Astro re-encodes it into WebP/AVIF at build time anyway.
- **File size of the source:** doesn't matter much. The source is processed at build time and never served. Don't waste time compressing the original.
- **What users actually download:** Astro emits 1 file per (format × width) combination — usually 5 widths × 3 formats = 15 generated files per slide. Browsers pick the smallest variant that meets their device's pixel density. On a typical phone that's ~80–120 KB; on a laptop ~200–350 KB; on 4K ~400–600 KB.
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

A single placeholder file at `src/assets/hero/placeholder.jpg` (a subtle blue grid texture). Until real photos are added, all 4 slides use it — fine for dev, not for launch.

---

## 12. Junior sessions tab (Google Sheet)

The **Junior Sessions** block on `/events` reads from its own tab on the same
Google Sheet from item 8. Skip this and the section shows a single hardcoded
fallback (Saturday 1:30–3:30pm) — fine for launch, easy to add later.

### 12a. Create the tab

1. Open the existing schedule sheet.
2. Click the `+` at the bottom-left to add a new tab. Rename it to **Juniors**.
3. In row 1 add these headers (case-insensitive):
   - `day` (required) — e.g. "Saturday"
   - `time` (required) — e.g. "1:30pm–3:30pm" (real en-dash `–`, see item 8)
4. One session per row. Just the two columns is the common case:

   | day | time |
   |---|---|
   | Saturday | 1:30pm–3:30pm |

   The junior cards show the venue (defaults to "Mulberry Academy Shoreditch")
   and the price, which **defaults to £3** for juniors. Add an optional `price`
   column only to override that for a specific session.

### 12b. Wire the tab's gid into the site

The "gid" is the numeric ID of the tab. Find it by clicking the Juniors tab and
looking at the URL: `...#gid=123456789` — that number is the gid.

1. Locally: add to `.env.local`:
   ```
   GOOGLE_JUNIORS_GID=123456789
   ```
2. In Netlify/Vercel: add `GOOGLE_JUNIORS_GID` as an env var with the same value.
3. Trigger a redeploy.

The webhook from item 8c already covers this tab — onChange fires for edits to
any tab in the sheet.

---

## 13. Tryouts tab (Google Sheet)

The **Pre-season Tryouts** section on `/events`, plus the alert bar and accent
band on the homepage, read from their own tab on the same Google Sheet from
item 8. Unlike sessions there is **no fallback**: if the tab is missing, empty,
or has no upcoming visible rows, none of these elements render — the feature is
invisible outside tryout season. Set this up only when you have tryouts to
announce.

### 13a. Create the tab

1. Open the existing schedule sheet.
2. Click the `+` at the bottom-left to add a new tab. Rename it to **Tryouts**.
3. In row 1 add these headers (case-insensitive):
   - `date` (required) — UK day-first **DD/MM/YYYY**, e.g. "13/09/2026"
   - `time` (required) — e.g. "6:00pm–8:00pm" (real en-dash `–`, see item 8)
   - `team` (required) — e.g. "Men's NVL", "Women's LVA", "Juniors"
   - `venue` (optional) — defaults to "Mulberry Academy Shoreditch" when blank
   - `form` (optional) — full Google Form sign-up URL; the "Sign up" button only
     appears when this is filled (otherwise the row shows "Sign-up soon")
   - `visible` (required) — a checkbox (Insert → Tick box) or the text `TRUE`/`FALSE`
4. One tryout per row. Example:

   | date | time | team | venue | form | visible |
   |---|---|---|---|---|---|
   | 13/09/2026 | 6:00pm–8:00pm | Men's NVL | | https://forms.gle/… | TRUE |

   **A tryout shows only when `visible` is TRUE *and* its date is today or later.**
   So you can plan the whole pre-season in advance with `visible` un-ticked, then
   tick a row when you're ready to announce it. Past tryouts drop off automatically.

### 13b. Wire the tab's gid into the site

The "gid" is the numeric ID of the tab. Find it by clicking the Tryouts tab and
looking at the URL: `...#gid=246813579` — that number is the gid.

1. Locally: add to `.env.local`:
   ```
   GOOGLE_TRYOUTS_GID=246813579
   ```
2. In Netlify/Vercel: add `GOOGLE_TRYOUTS_GID` as an env var with the same value.
3. Trigger a redeploy.

The webhook from item 8c already covers this tab — editing the sheet rebuilds
the site, so newly-ticked tryouts appear (and just-passed ones disappear) on the
next edit. **Note:** because the site is static, a tryout whose date has passed
only drops off at the next rebuild. It will clear whenever you next edit the
sheet or redeploy. If you want past tryouts to expire on the day with no manual
edit, add a daily scheduled build (e.g. a Netlify/Vercel scheduled deploy or a
cron-triggered build hook) — optional.

---

## 14. Instagram feed (Behold.so)

The homepage "Follow @lionhearts_volleyball" section shows a grid of your 6
latest Instagram posts. It's fetched **once at build time** from a Behold.so
JSON feed and rendered as static HTML — so visitors never hit Behold directly
and you never approach Behold's free-tier view cap, no matter how much traffic
the site gets. Until you wire in a feed ID, that section shows a simple
"follow us" fallback panel instead (perfectly fine for launch).

### 14a. Create the Behold feed

1. Create a free account at [behold.so](https://behold.so).
2. Connect the **@lionhearts_volleyball** Instagram account (Behold walks you
   through Instagram's login — it handles the access-token refresh for you, so
   there's nothing to maintain afterwards).
3. Create a **feed** and open its settings. Behold gives each feed a JSON URL
   like `https://feeds.behold.so/AbC123xyz`.
4. Copy the **feed ID** — that's just the last part of the URL
   (`AbC123xyz` in the example above), not the whole URL.

   The free plan returns up to 6 posts, which is exactly what the grid shows.

### 14b. Wire the ID into the site

1. Locally (optional, for testing): add to `.env.local` in the project root:
   ```
   BEHOLD_FEED_ID=<paste-feed-id-here>
   ```
   Then `npm run dev` and check the homepage Instagram grid shows real posts.
   (To skip the fetch during local builds, set `SKIP_BEHOLD=true` — the grid
   falls back to the "follow us" panel with no network call.)
2. In Netlify/Vercel: project settings → **Environment Variables** → add
   `BEHOLD_FEED_ID` with the same value.
3. Trigger a redeploy. The grid now shows your latest posts.

### 14c. Keeping it fresh (optional)

Because posts are pulled at **build time**, new Instagram posts only appear
after the site rebuilds. The Google-Sheets webhook from item 8c does **not**
cover Instagram. If you want the grid to refresh on its own, add a **daily
scheduled build**:

- **Netlify:** Site → Build & deploy → **Build hooks** (the same hook from item
  8c works) and a scheduled trigger, or Netlify's scheduled functions.
- **Vercel:** Project → Settings → **Cron Jobs**, or a deploy hook pinged daily.

Once a day is plenty — match-day photos showing up the next morning is the
expected behaviour. Without a schedule, the grid still updates whenever the
site rebuilds for any other reason (e.g. a sheet edit or a content change).

---

## Image folder structure (for reference)

```
src/
  assets/
    hero/                          ← Astro processes these (responsive)
      01-super-league.jpg
      02-lva-premier.jpg
      03-open-session.jpg
      04-community.jpg
      placeholder.jpg              ← delete once all 4 are added

public/
  images/                          ← served as-is (no responsive)
    teams/
      vinarius.jpg                 (or .webp)
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




Add other sponsors, make vinarius superleague sponsor,
Add analytics


Pending data
- add hero carousel images
- open sessions placeholder
- svgs

