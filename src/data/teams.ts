export interface Team {
  name: string;
  gender: "Women's" | "Men's";
  division: string;
  badge?: string;
  volleyzoneSlug?: string;
  compId?: string;
  seasonId?: string;
  volleyzoneUserId?: string;
  volleyzoneSegment?: 'lva' | 'nvl';
  /** Exact name Volleyzone prints for this team, used to claim cup matches. */
  volleyzoneTeamName?: string;
}

export interface CupCompetition {
  compId: string;
  seasonId: string;
  userId: string;
  segment: 'lva' | 'nvl';
  /** Chip text shown against a match from this competition. */
  label: string;
}

// Knockout competitions are scanned in full every build and merged into
// whichever teams appear in the draw, so later rounds need no edit here. All
// four are NVL — LVA runs divisions only, no cups.
export const CUP_COMPETITIONS: CupCompetition[] = [
  { compId: '217919', seasonId: '4013', userId: '279580', segment: 'nvl', label: 'Cup' },
  { compId: '217917', seasonId: '4013', userId: '279580', segment: 'nvl', label: 'Shield' },
  { compId: '217920', seasonId: '4013', userId: '279580', segment: 'nvl', label: 'Cup' },
  { compId: '217921', seasonId: '4013', userId: '279580', segment: 'nvl', label: 'Shield' },
];

export const VOLLEYZONE_BASE_LVA =
  'https://competitions.volleyzone.co.uk/fixture-and-results/lva/';

export const VOLLEYZONE_BASE_NVL =
  'https://competitions.volleyzone.co.uk/fixture-and-results/nvl/';

/** Photo filename (src/assets/teams/<slug>.jpg) and /fixtures#<slug> anchor. */
export function teamSlug(team: Pick<Team, 'name'>): string {
  return team.name.toLowerCase().replace(/\s+/g, '-');
}

/** @deprecated use VOLLEYZONE_BASE_LVA */
export const VOLLEYZONE_BASE = VOLLEYZONE_BASE_LVA;

export const teams: Team[] = [
  // Women's
  {
    name: 'Vinarius', gender: "Women's", division: 'NVL Super League',
    badge: 'Super League', volleyzoneSlug: 'lionhearts-vinarius',
    volleyzoneTeamName: 'Lionhearts Vinarius',
    compId: '216377', seasonId: '4013', volleyzoneUserId: '279580', volleyzoneSegment: 'nvl',
  },
  {
    name: 'Fury', gender: "Women's", division: 'LVA Premier League',
    volleyzoneSlug: 'lionhearts-fury',
    volleyzoneTeamName: 'Lionhearts Fury',
    compId: '219585', seasonId: '4015', volleyzoneUserId: '298568', volleyzoneSegment: 'lva',
  },
  {
    name: 'Cats', gender: "Women's", division: 'LVA Division 1B',
    volleyzoneSlug: 'lionhearts-cats',
    volleyzoneTeamName: 'Lionhearts Cats',
    compId: '219587', seasonId: '4015', volleyzoneUserId: '298568', volleyzoneSegment: 'lva',
  },
  {
    name: 'Beats', gender: "Women's", division: 'LVA Division 1A',
    volleyzoneSlug: 'lionhearts-beats',
    volleyzoneTeamName: 'Lionhearts Beats',
    compId: '219586', seasonId: '4015', volleyzoneUserId: '298568', volleyzoneSegment: 'lva',
  },
  // Men's
  {
    name: 'Alpha', gender: "Men's", division: 'LVA Premier League',
    volleyzoneSlug: 'lionhearts-alpha',
    volleyzoneTeamName: 'Lionhearts Alpha',
    compId: '219574', seasonId: '4015', volleyzoneUserId: '298568', volleyzoneSegment: 'lva',
  },
  {
    name: 'Predators', gender: "Men's", division: 'LVA Division 1A',
    volleyzoneSlug: 'lionhearts-predators',
    volleyzoneTeamName: 'Lionhearts Predators',
    compId: '219575', seasonId: '4015', volleyzoneUserId: '298568', volleyzoneSegment: 'lva',
  },
  {
    name: 'Pride', gender: "Men's", division: 'LVA Division 2B',
    volleyzoneSlug: 'lionhearts-pride',
    volleyzoneTeamName: 'Lionhearts Pride',
    compId: '219578', seasonId: '4015', volleyzoneUserId: '298568', volleyzoneSegment: 'lva',
  },
  {
    name: 'Roar', gender: "Men's", division: 'LVA Division 3B',
    volleyzoneSlug: 'lionhearts-roar',
    volleyzoneTeamName: 'Lionhearts Roar',
    compId: '219583', seasonId: '4015', volleyzoneUserId: '298568', volleyzoneSegment: 'lva',
  },
  {
    name: 'London Lionhearts', gender: "Men's", division: 'NVL Division 2 South',
    volleyzoneSlug: 'lionhearts-leo',
    volleyzoneTeamName: 'London Lionhearts',
    compId: '216372', seasonId: '4013', volleyzoneUserId: '279580', volleyzoneSegment: 'nvl',
  },
];

// NOTE: volleyzoneSlug is inert. Verified against the 2026-27 pages: Volleyzone's
// team filter is a client-side <select>, not a URL parameter, so the `?team=<slug>`
// link built in fixtures.astro is ignored and the link just lands on the division
// page. Kept only so removing it stays a deliberate decision.
