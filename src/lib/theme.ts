// Theme resolution shared by the boot script (mirrored inline) and the toggle.
export type Theme = 'light' | 'dark';
export const THEME_KEY = 'lh-theme';

/**
 * Resolve the initial theme: a valid stored choice wins; otherwise follow the
 * device preference; otherwise default to light.
 */
export function resolveInitialTheme(
  stored: string | null | undefined,
  prefersDark: boolean,
): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return prefersDark ? 'dark' : 'light';
}
