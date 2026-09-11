export type Slot = 1 | 2 | 3 | 4 | 5 | 6;
export type Role = 'S' | 'OPP' | 'OH' | 'MB' | 'L';
export type Phase = 0 | 1 | 2 | 3 | 4 | 5;

export interface Vec2 { x: number; y: number }
export type Placement = Record<Slot, Vec2>;

/** Court half, metres. x: 0 left sideline → 9 right. y: 0 net → 9 end line. */
export const COURT_M = 9;

/** The club's 5-1, read around the circle from position 1 in rotation 1. */
export const LINEUP_CYCLE = ['S', 'OH', 'MB', 'OPP', 'OH', 'MB'] as const;

export const FRONT_ROW: Slot[] = [4, 3, 2];
export const BACK_ROW: Slot[] = [5, 6, 1];
export const ALL_SLOTS: Slot[] = [1, 2, 3, 4, 5, 6];

/** [front, back] — the corresponding pairs of 7.4.2.1, NOT the diagonals. */
export const DEPTH_PAIRS: ReadonlyArray<readonly [Slot, Slot]> = [[4, 5], [3, 6], [2, 1]];

/** Left-to-right order within each row, per 7.4.2.2. */
export const LATERAL_ROWS: ReadonlyArray<ReadonlyArray<Slot>> = [[4, 3, 2], [5, 6, 1]];

export const isFrontRow = (slot: Slot): boolean => FRONT_ROW.includes(slot);

/** Role occupying a slot from the starting line-up, before libero substitution. */
export function roleAt(slot: Slot, phase: Phase): Role {
  return LINEUP_CYCLE[(slot - 1 + phase) % 6];
}

/** The back-row middle, who the libero always comes on for. */
export function liberoSlot(phase: Phase): Slot {
  const slot = BACK_ROW.find(s => roleAt(s, phase) === 'MB');
  if (!slot) throw new Error(`no back-row middle in phase ${phase}`);
  return slot;
}

/** Role actually standing in a slot, libero substitution applied. */
export function onCourtRole(slot: Slot, phase: Phase): Role {
  return slot === liberoSlot(phase) ? 'L' : roleAt(slot, phase);
}

const slotWhere = (phase: Phase, role: Role): Slot => {
  const slot = ALL_SLOTS.find(s => onCourtRole(s, phase) === role);
  if (!slot) throw new Error(`no ${role} on court in phase ${phase}`);
  return slot;
};

export const setterSlot = (phase: Phase): Slot => slotWhere(phase, 'S');
export const oppositeSlot = (phase: Phase): Slot => slotWhere(phase, 'OPP');
export const middleSlot = (phase: Phase): Slot => slotWhere(phase, 'MB');

/** The libero and both outsides — exactly three, every rotation. */
export function passerSlots(phase: Phase): Slot[] {
  return ALL_SLOTS.filter(s => {
    const role = onCourtRole(s, phase);
    return role === 'L' || role === 'OH';
  });
}

/** Team system values — our convention, not the rulebook. */
export const PASS_BAND = { min: 5, max: 7 } as const;
export const PASS_SPREAD = 2;
export const MB_NET_MAX = 1.5;
export const OPP_NET_MAX = 2;
export const SETTER_TARGET: Vec2 = { x: 6.5, y: 0.5 };

/** Physical sanity, not a rule. */
export const MIN_SEPARATION = 0.7;

/**
 * Per-rotation setter radius. Replaced by `npm run gen:rotations`, which
 * proves each value reachable with a committed witness formation.
 */
export const SETTER_RADIUS: Record<Phase, number> = {
  0: 5, 1: 2, 2: 3, 3: 3, 4: 2, 5: 2,
};

export type Constraint =
  | { kind: 'depthOrder'; front: Slot; back: Slot }
  | { kind: 'lateralOrder'; left: Slot; right: Slot }
  | { kind: 'inCourt' }
  | { kind: 'separation'; min: number }
  | { kind: 'depthBand'; slots: Slot[]; min: number; max: number }
  | { kind: 'spread'; slots: Slot[]; min: number }
  | { kind: 'nearNet'; slot: Slot; max: number }
  | { kind: 'nearPoint'; slot: Slot; point: Vec2; radius: number };

export function constraintsFor(phase: Phase): Constraint[] {
  const passers = passerSlots(phase);
  const opposite = oppositeSlot(phase);

  const cs: Constraint[] = [
    ...DEPTH_PAIRS.map(([front, back]): Constraint => ({ kind: 'depthOrder', front, back })),
    ...LATERAL_ROWS.flatMap((row): Constraint[] =>
      row.slice(0, -1).map((left, i) => ({ kind: 'lateralOrder', left, right: row[i + 1] }))),
    { kind: 'inCourt' },
    { kind: 'separation', min: MIN_SEPARATION },
    { kind: 'depthBand', slots: passers, min: PASS_BAND.min, max: PASS_BAND.max },
    { kind: 'spread', slots: passers, min: PASS_SPREAD },
    { kind: 'nearNet', slot: middleSlot(phase), max: MB_NET_MAX },
    { kind: 'nearPoint', slot: setterSlot(phase), point: SETTER_TARGET, radius: SETTER_RADIUS[phase] },
  ];

  if (isFrontRow(opposite)) cs.push({ kind: 'nearNet', slot: opposite, max: OPP_NET_MAX });
  return cs;
}

export interface Violation {
  kind: Constraint['kind'];
  slots: Slot[];
  message: string;
}

export type SlotLabel = (slot: Slot) => string;
const defaultLabel: SlotLabel = slot => `P${slot}`;

const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y);
const m = (v: number) => `${v.toFixed(1)}m`;

/**
 * Every ordering is `>=` / `<=`: FIVB 7.4.3.1 and 7.4.3.2 both permit a player
 * to be "level with" the player they are judged against.
 */
export function validate(p: Placement, constraints: Constraint[], label: SlotLabel = defaultLabel): Violation[] {
  const out: Violation[] = [];

  for (const c of constraints) {
    switch (c.kind) {
      case 'depthOrder': {
        if (p[c.back].y >= p[c.front].y) break;
        out.push({
          kind: c.kind, slots: [c.front, c.back],
          message: `${label(c.back)} is ${m(p[c.front].y - p[c.back].y)} in front of ${label(c.front)}. `
            + 'A back-row player must be level with or further from the net than their front-row partner.',
        });
        break;
      }
      case 'lateralOrder': {
        if (p[c.left].x <= p[c.right].x) break;
        out.push({
          kind: c.kind, slots: [c.left, c.right],
          message: `${label(c.left)} has crossed to the right of ${label(c.right)}. `
            + 'Each row must stay in left-to-right order.',
        });
        break;
      }
      case 'inCourt': {
        const out_ = ALL_SLOTS.filter(s => {
          const { x, y } = p[s];
          return x < 0 || x > COURT_M || y < 0 || y > COURT_M;
        });
        if (!out_.length) break;
        out.push({
          kind: c.kind, slots: out_,
          message: `${out_.map(label).join(', ')} must be inside our own half at the service hit.`,
        });
        break;
      }
      case 'separation': {
        for (let i = 0; i < ALL_SLOTS.length; i++) {
          for (let j = i + 1; j < ALL_SLOTS.length; j++) {
            const [a, b] = [ALL_SLOTS[i], ALL_SLOTS[j]];
            if (dist(p[a], p[b]) >= c.min) continue;
            out.push({
              kind: c.kind, slots: [a, b],
              message: `${label(a)} and ${label(b)} are standing on top of each other.`,
            });
          }
        }
        break;
      }
      case 'depthBand': {
        for (const s of c.slots) {
          const { y } = p[s];
          if (y >= c.min && y <= c.max) continue;
          out.push({
            kind: c.kind, slots: [s],
            message: `${label(s)} is passing from ${m(y)}. Our three passers receive between `
              + `${m(c.min)} and ${m(c.max)} from the net.`,
          });
        }
        break;
      }
      case 'spread': {
        for (let i = 0; i < c.slots.length; i++) {
          for (let j = i + 1; j < c.slots.length; j++) {
            const [a, b] = [c.slots[i], c.slots[j]];
            if (dist(p[a], p[b]) >= c.min) continue;
            out.push({
              kind: c.kind, slots: [a, b],
              message: `${label(a)} and ${label(b)} are only ${m(dist(p[a], p[b]))} apart. `
                + `Passers stay at least ${m(c.min)} from each other so they do not chase the same ball.`,
            });
          }
        }
        break;
      }
      case 'nearNet': {
        if (p[c.slot].y <= c.max) break;
        out.push({
          kind: c.kind, slots: [c.slot],
          message: `${label(c.slot)} is ${m(p[c.slot].y)} off the net and cannot attack from there. `
            + `Stay within ${m(c.max)}.`,
        });
        break;
      }
      case 'nearPoint': {
        const d = dist(p[c.slot], c.point);
        if (d <= c.radius) break;
        out.push({
          kind: c.kind, slots: [c.slot],
          message: `${label(c.slot)} is ${m(d)} from the release point and will not make it to set. `
            + `Get within ${m(c.radius)}.`,
        });
        break;
      }
    }
  }
  return out;
}
