// src/data/teams.ts
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
}

export const VOLLEYZONE_BASE_LVA =
  'https://competitions.volleyzone.co.uk/fixture-and-results/lva/';

export const VOLLEYZONE_BASE_NVL =
  'https://competitions.volleyzone.co.uk/fixture-and-results/nvl/';

/** @deprecated use VOLLEYZONE_BASE_LVA */
export const VOLLEYZONE_BASE = VOLLEYZONE_BASE_LVA;

export const teams: Team[] = [
  // Women's
  {
    name: 'Vinarius', gender: "Women's", division: 'NVL Super League',
    badge: '⚡ Super League', volleyzoneSlug: 'lionhearts-vinarius',
    compId: '206206', seasonId: '3852', volleyzoneUserId: '279580', volleyzoneSegment: 'nvl',
  },
  {
    name: 'Fury', gender: "Women's", division: 'LVA Premier League',
    volleyzoneSlug: 'lionhearts-fury',
    compId: '209503', seasonId: '3881', volleyzoneUserId: '298568', volleyzoneSegment: 'lva',
  },
  {
    name: 'Cats', gender: "Women's", division: 'LVA Division 1',
    volleyzoneSlug: 'lionhearts-cats',
    compId: '209502', seasonId: '3881', volleyzoneUserId: '298568', volleyzoneSegment: 'lva',
  },
  {
    name: 'Beats', gender: "Women's", division: 'LVA Division 1',
    volleyzoneSlug: 'lionhearts-beats',
    compId: '209506', seasonId: '3881', volleyzoneUserId: '298568', volleyzoneSegment: 'lva',
  },
  // Men's
  {
    name: 'Alpha', gender: "Men's", division: 'LVA Premier League',
    volleyzoneSlug: 'lionhearts-alpha',
    compId: '209508', seasonId: '3881', volleyzoneUserId: '298568', volleyzoneSegment: 'lva',
  },
  {
    name: 'Predators', gender: "Men's", division: 'LVA Division 1',
    volleyzoneSlug: 'lionhearts-predators',
    compId: '209510', seasonId: '3881', volleyzoneUserId: '298568', volleyzoneSegment: 'lva',
  },
  {
    name: 'Pride', gender: "Men's", division: 'LVA Division 2',
    volleyzoneSlug: 'lionhearts-pride',
    compId: '209511', seasonId: '3881', volleyzoneUserId: '298568', volleyzoneSegment: 'lva',
  },
  {
    name: 'Roar', gender: "Men's", division: 'LVA Division 3',
    volleyzoneSlug: 'lionhearts-roar',
    compId: '209513', seasonId: '3881', volleyzoneUserId: '298568', volleyzoneSegment: 'lva',
  },
  {
    name: 'Leo', gender: "Men's", division: 'NVL Division 2',
    volleyzoneSlug: 'lionhearts-leo',
    compId: '206204', seasonId: '3852', volleyzoneUserId: '279580', volleyzoneSegment: 'nvl',
  },
];

// NOTE: volleyzoneSlug values are guesses. Before launch, visit
// https://competitions.volleyzone.co.uk/fixture-and-results/lva/,
// select each team, copy the URL, and update the slugs here.
