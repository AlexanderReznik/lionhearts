/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly GOOGLE_SHEET_ID?: string;
  readonly GOOGLE_TRYOUTS_GID?: string;
  readonly BEHOLD_FEED_ID?: string;
  /** Local-dev only: set to "true" to skip Volleyzone fixture fetches. */
  readonly SKIP_VOLLEYZONE?: string;
  /** "on"/"off" forces the Christmas theme; unset means by date. */
  readonly CHRISTMAS_THEME?: string;
}
