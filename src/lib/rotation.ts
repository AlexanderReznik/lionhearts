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
