import type { Role } from '../lib/rotation';

export interface SquadMember {
  number: number;
  role: Role;
}

/**
 * A fixed fictional squad, the same in every puzzle, so regulars come to know
 * it the way they know a real team sheet. Two of each specialist, four
 * outsides and four middles — a normal 5-1 bench.
 */
export const SQUAD: SquadMember[] = [
  { number: 1,  role: 'S'   }, { number: 11, role: 'S'   },
  { number: 5,  role: 'OPP' }, { number: 15, role: 'OPP' },
  { number: 3,  role: 'OH'  }, { number: 7,  role: 'OH'  },
  { number: 12, role: 'OH'  }, { number: 17, role: 'OH'  },
  { number: 4,  role: 'MB'  }, { number: 9,  role: 'MB'  },
  { number: 14, role: 'MB'  }, { number: 20, role: 'MB'  },
  { number: 10, role: 'L'   }, { number: 18, role: 'L'   },
];
