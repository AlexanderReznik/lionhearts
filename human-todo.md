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
- **Size:** 800×600px (landscape)
- **Format:** JPEG or WebP (WebP preferred — ~30% smaller)
- **File size:** aim for under 200 KB each
- Photos from a phone are fine — just resize before dropping in

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

1. Create a Google Sheet with **exactly** these column headers in row 1:
   `day`, `time`, `level`, `venue`, `price`
2. One session per row. Example:

   | day | time | level | venue | price |
   |---|---|---|---|---|
   | Monday | 7:00pm–9:00pm | All Levels | Mulberry Academy | £8 cash / £10 card |
   | Thursday | 7:00pm–9:00pm | All Levels | Mulberry Academy | £8 cash / £10 card |
   | Friday | 8:00pm–10:00pm | Intermediate / Advanced | Mulberry Academy | £8 cash / £10 card |

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

## Image folder structure (for reference)

```
public/
  images/
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
