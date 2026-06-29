# OG / social image sources

Sources for the static social-sharing assets in `public/images/`. Both are
generated, not hand-edited — regenerate them here if the brand or copy changes.

## `og-default.jpg` — 1200×630 share card

Wired into every page via `BaseHead.astro` (`og:image` / `twitter:image`).

1. Open `scripts/og/og-card.html` in Chrome (relative paths load Barlow from
   `node_modules` and the crest from `public/brand`, so deps must be installed).
2. Emulate a **1200×630 viewport at deviceScaleFactor 2** and wait for
   `document.fonts.ready`, then screenshot the viewport → a 2400×1260 PNG.
3. Downscale to a crisp 1200×630 JPG:
   ```js
   const sharp = require('sharp');
   sharp('shot@2x.png')
     .resize(1200, 630, { fit: 'cover' })
     .jpeg({ quality: 88, mozjpeg: true })
     .toFile('public/images/og-default.jpg');
   ```

To change the wording, edit `.wordmark` / `.tagline` in `og-card.html`.

## `logo-lionhearts-512.png` — 512×512 Organization logo

Used by the JSON-LD `Organization.logo` in `src/pages/index.astro` (this is the
brand mark for search/knowledge-panel use — NOT the wide share card). Google
requires a raster ≥112×112; SVG is not accepted, hence the PNG. White crest on
brand navy so it stays legible on white surfaces and in square/circle crops.

```js
const sharp = require('sharp');
const SIZE = 512;
const navy = { r: 0x11, g: 0x23, b: 0x4b, alpha: 1 }; // --lh-navy #11234b
(async () => {
  const crest = await sharp('public/brand/logo-submark.svg', { density: 400 })
    .resize({ height: Math.round(SIZE * 0.70) })
    .png().toBuffer();
  await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: navy } })
    .composite([{ input: crest, gravity: 'center' }])
    .png().toFile('public/images/logo-lionhearts-512.png');
})();
```
