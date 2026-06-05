// Maps a team name to its official wordmark asset under /brand/teams/.
// Base = navy (for light backgrounds); white = for dark backgrounds.
export type WordmarkVariant = 'base' | 'white';

export function teamWordmarkSrc(name: string, variant: WordmarkVariant = 'base'): string {
  const slug = name.trim().toLowerCase();
  return variant === 'white'
    ? `/brand/teams/${slug}.svg`
    : `/brand/teams/${slug}-base.svg`;
}
