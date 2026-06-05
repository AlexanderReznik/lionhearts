import { describe, it, expect } from 'vitest';
import { resolveInitialTheme, THEME_KEY } from '../../src/lib/theme';

describe('resolveInitialTheme', () => {
  it('uses the stored value when present (stored wins over device)', () => {
    expect(resolveInitialTheme('dark', false)).toBe('dark');
    expect(resolveInitialTheme('light', true)).toBe('light');
  });

  it('falls back to the device preference when nothing is stored', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark');
    expect(resolveInitialTheme(null, false)).toBe('light');
  });

  it('defaults to light when stored is absent and device is not dark', () => {
    expect(resolveInitialTheme(undefined, false)).toBe('light');
  });

  it('ignores an invalid stored value and uses the device preference', () => {
    expect(resolveInitialTheme('purple', true)).toBe('dark');
  });

  it('exposes the storage key', () => {
    expect(THEME_KEY).toBe('lh-theme');
  });
});
