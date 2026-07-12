// src/data/flags.ts — member-chosen flags for the community mosaic.
//
// Source of truth: flags.txt (repo root), in the order members added them.
// Two entries are deliberately NOT the current official state flag — the
// white-red-white Belarus flag and the lion-and-sun Iran flag. We show what
// members asked for, so these are self-hosted like every other flag (no
// ISO-keyed CDN carries them). Assets live in src/assets/flags/.
import type { ImageMetadata } from 'astro';

import scotland from '../assets/flags/scotland.svg';
import hongKong from '../assets/flags/hong-kong.svg';
import thailand from '../assets/flags/thailand.svg';
import spain from '../assets/flags/spain.svg';
import vietnam from '../assets/flags/vietnam.svg';
import denmark from '../assets/flags/denmark.svg';
import italy from '../assets/flags/italy.svg';
import belgium from '../assets/flags/belgium.svg';
import france from '../assets/flags/france.svg';
import australia from '../assets/flags/australia.svg';
import serbia from '../assets/flags/serbia.svg';
import uk from '../assets/flags/uk.svg';
import lithuania from '../assets/flags/lithuania.svg';
import croatia from '../assets/flags/croatia.svg';
import turkey from '../assets/flags/turkey.svg';
import belarusWrw from '../assets/flags/belarus-wrw.svg';
import iranLionSun from '../assets/flags/iran-lion-sun.svg';

export interface Flag {
  /** Display name in members' own wording — used as alt and title text. */
  name: string;
  /** Local SVG asset (astro:assets). */
  src: ImageMetadata;
}

export const flags: Flag[] = [
  { name: 'Scotland', src: scotland },
  { name: 'Hong Kong', src: hongKong },
  { name: 'Thailand', src: thailand },
  { name: 'Spain', src: spain },
  { name: 'Vietnam', src: vietnam },
  { name: 'Denmark', src: denmark },
  { name: 'Italy', src: italy },
  { name: 'Belgium', src: belgium },
  { name: 'France', src: france },
  { name: 'Australia', src: australia },
  { name: 'Serbia', src: serbia },
  { name: 'UK', src: uk },
  { name: 'Lithuania', src: lithuania },
  { name: 'Croatia', src: croatia },
  { name: 'Turkey', src: turkey },
  { name: 'Belarus', src: belarusWrw },
  { name: 'Iran', src: iranLionSun },
];
