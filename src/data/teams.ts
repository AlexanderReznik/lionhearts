// src/data/teams.ts
export interface Team {
  name: string;
  gender: "Women's" | "Men's";
  division: string;
  badge?: string;
  volleyzoneSlug?: string;
}

export const VOLLEYZONE_BASE =
  'https://competitions.volleyzone.co.uk/fixture-and-results/lva/';

export const teams: Team[] = [
  // Women's
  { name: 'Vinarius',   gender: "Women's", division: 'LVA Premier League', badge: '⚡ Super League', volleyzoneSlug: 'lionhearts-vinarius' },
  { name: 'Cats',       gender: "Women's", division: 'LVA Division 1',     volleyzoneSlug: 'lionhearts-cats' },
  { name: 'Fury',       gender: "Women's", division: 'LVA Division 2',     volleyzoneSlug: 'lionhearts-fury' },
  { name: 'Beats',      gender: "Women's", division: 'LVA Division 3',     volleyzoneSlug: 'lionhearts-beats' },
  // Men's
  { name: 'Alpha',      gender: "Men's",   division: 'NVL Super League',   badge: '⚡ Super League', volleyzoneSlug: 'lionhearts-alpha' },
  { name: 'Predators',  gender: "Men's",   division: 'LVA Division 1',     volleyzoneSlug: 'lionhearts-predators' },
  { name: 'Pride',      gender: "Men's",   division: 'LVA Division 2',     volleyzoneSlug: 'lionhearts-pride' },
  { name: 'Roar',       gender: "Men's",   division: 'LVA Division 3',     volleyzoneSlug: 'lionhearts-roar' },
  { name: 'Leo',        gender: "Men's",   division: 'LVA Division 4',     volleyzoneSlug: 'lionhearts-leo' },
];
