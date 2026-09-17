import { writeFileSync } from 'node:fs';
import {
  ALL_SLOTS, COURT_M, LINEUP_CYCLE, MIN_SEPARATION, validate,
  type Phase, type Placement, type Slot,
} from '../src/lib/rotation.ts';
import { PHASES, lawConstraintsFor, faultIn } from '../src/lib/judge.ts';
import { SQUAD } from '../src/data/squad.ts';

const DAYS = 760;                 // matches the rotation bank, so both roll over together
const CALLS = 6;

// Fixed seed so `npm run gen:judge` regenerates byte-identical output.
const SEED = 0x30d9e5a7;

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const nextRandom = mulberry32(SEED);
const rand = (lo: number, hi: number) => lo + nextRandom() * (hi - lo);
const pick = <T,>(xs: T[]): T => xs[Math.floor(nextRandom() * xs.length)];

function shuffle<T>(xs: T[]): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A formation that satisfies the positional law by construction. */
function sampleLegal(): Placement {
  const xf = [rand(0.5, 2.5), rand(3.2, 5.2), rand(6, 8.5)].sort((a, b) => a - b);
  const xb = [rand(0.5, 2.5), rand(3.2, 5.2), rand(6, 8.5)].sort((a, b) => a - b);
  const yf = [rand(0.4, 3.2), rand(0.4, 3.2), rand(0.4, 3.2)];
  const yb = [yf[0] + rand(1, 5), yf[1] + rand(1, 5), yf[2] + rand(1, 5)]
    .map(v => Math.min(v, COURT_M - 0.2));
  return {
    4: { x: xf[0], y: yf[0] }, 3: { x: xf[1], y: yf[1] }, 2: { x: xf[2], y: yf[2] },
    5: { x: xb[0], y: yb[0] }, 6: { x: xb[1], y: yb[1] }, 1: { x: xb[2], y: yb[2] },
  } as Placement;
}

/** Round to the 2dp the bank commits, before validating — a value that only
 *  passes at full precision would ship as a violation after rounding. */
const round2 = (p: Placement): Placement => {
  const out: Placement = { ...p };
  for (const s of ALL_SLOTS) out[s] = { x: Math.round(p[s].x * 100) / 100, y: Math.round(p[s].y * 100) / 100 };
  return out;
};

const minSeparation = (p: Placement): number => {
  let d = Infinity;
  for (let i = 0; i < ALL_SLOTS.length; i++) {
    for (let j = i + 1; j < ALL_SLOTS.length; j++) {
      const a = p[ALL_SLOTS[i]], b = p[ALL_SLOTS[j]];
      d = Math.min(d, Math.hypot(a.x - b.x, a.y - b.y));
    }
  }
  return d;
};

const orderingPairs = (phase: Phase) => lawConstraintsFor(phase)
  .filter(c => c.kind === 'depthOrder' || c.kind === 'lateralOrder');

/** Break exactly one ordering by `gap` metres. */
function makeIllegal(phase: Phase, gap: number): Placement | null {
  for (let t = 0; t < 600; t++) {
    const base = sampleLegal();
    if (validate(base, lawConstraintsFor(phase)).length) continue;
    const c = pick(orderingPairs(phase)) as { kind: string; front?: Slot; back?: Slot; left?: Slot; right?: Slot };
    const q: Placement = { ...base };
    for (const s of ALL_SLOTS) q[s] = { ...base[s] };
    if (c.kind === 'depthOrder') q[c.back!] = { ...q[c.back!], y: base[c.front!].y - gap };
    else q[c.left!] = { ...q[c.left!], x: base[c.right!].x + gap };
    const r = round2(q);
    if (validate(r, lawConstraintsFor(phase)).length !== 1) continue;
    if (minSeparation(r) < MIN_SEPARATION) continue;
    if (!faultIn(r, phase)) continue;
    return r;
  }
  return null;
}

/** Squeeze one ordering to `margin` metres while staying legal. */
function makeTightLegal(phase: Phase, margin: number): Placement | null {
  for (let t = 0; t < 600; t++) {
    const base = sampleLegal();
    if (validate(base, lawConstraintsFor(phase)).length) continue;
    const c = pick(orderingPairs(phase)) as { kind: string; front?: Slot; back?: Slot; left?: Slot; right?: Slot };
    const q: Placement = { ...base };
    for (const s of ALL_SLOTS) q[s] = { ...base[s] };
    if (c.kind === 'depthOrder') q[c.back!] = { ...q[c.back!], y: base[c.front!].y + margin };
    else q[c.left!] = { ...q[c.left!], x: base[c.right!].x - margin };
    const r = round2(q);
    if (validate(r, lawConstraintsFor(phase)).length) continue;
    if (minSeparation(r) < MIN_SEPARATION) continue;
    return r;
  }
  return null;
}

const byRole = (r: string) => SQUAD.filter(m => m.role === r).map(m => m.number);

function cast(): { start: number[]; libero: number } {
  const oh = shuffle(byRole('OH')).slice(0, 2);
  const mb = shuffle(byRole('MB')).slice(0, 2);
  const pool: Record<string, number[]> = {
    S: [pick(byRole('S'))], OPP: [pick(byRole('OPP'))], OH: oh, MB: mb,
  };
  return { start: LINEUP_CYCLE.map(role => pool[role].shift()!), libero: pick(byRole('L')) };
}

/** Between two and four illegal, shuffled so position carries no information. */
function mix(): boolean[] {
  const illegal = 2 + Math.floor(nextRandom() * 3);
  return shuffle([...Array(illegal).fill(true), ...Array(CALLS - illegal).fill(false)]);
}

function day(id: number): { id: number; start: number[]; libero: number; startPhase: Phase; formations: Placement[] } {
  const startPhase = pick(PHASES);
  const wants = mix();
  const formations: Placement[] = [];
  for (let i = 0; i < CALLS; i++) {
    const phase = ((startPhase + i) % 6) as Phase;
    // Tighten across the round: call one is obvious, call six is hard.
    const t = i / (CALLS - 1);
    const p = wants[i]
      ? makeIllegal(phase, 1.2 - t * 0.9)      // 1.2m down to 0.3m
      : makeTightLegal(phase, 0.3 - t * 0.25); // 0.3m down to 0.05m
    if (!p) throw new Error(`day ${id}: could not build call ${i} for rotation ${phase}`);
    formations.push(p);
  }
  return { id, ...cast(), startPhase, formations };
}

const bank = Array.from({ length: DAYS }, (_, id) => day(id));

const fmt = (p: Placement) => `{ ${ALL_SLOTS.map(s =>
  `${s}: { x: ${p[s].x.toFixed(2)}, y: ${p[s].y.toFixed(2)} }`).join(', ')} }`;

writeFileSync('src/data/judge.ts',
  `// Generated by \`npm run gen:judge\`. Committed so a later code change can\n`
  + `// never rewrite which calls appeared on a day people already played.\n`
  + `// Deliberately stores formations only: legality is recomputed by\n`
  + `// src/lib/judge.ts, so the answer ships nowhere.\n`
  + `import type { Phase, Placement } from '../lib/rotation';\n\n`
  + `export interface JudgePuzzle {\n  id: number;\n`
  + `  /** P1..P6 shirt numbers of the R1 line-up. */\n  start: number[];\n`
  + `  libero: number;\n  /** Call 1 is this rotation; each call advances one. */\n`
  + `  startPhase: Phase;\n  formations: Placement[];\n}\n\n`
  + `export const JUDGE: JudgePuzzle[] = [\n`
  + bank.map(d => `  { id: ${d.id}, start: [${d.start.join(', ')}], libero: ${d.libero}, `
    + `startPhase: ${d.startPhase}, formations: [${d.formations.map(fmt).join(', ')}] },`).join('\n')
  + `\n];\n`);

console.log(`wrote ${bank.length} judge days`);
