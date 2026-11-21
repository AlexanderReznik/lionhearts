import { londonParts } from './sheets';

/** Christmas theme is on from 1 Dec to 5 Jan (London time); `override` "on"/"off" forces it. */
export function isChristmasSeason(now: Date, override?: string): boolean {
  if (override === 'on') return true;
  if (override === 'off') return false;
  const { m, d } = londonParts(now);
  return m === 12 || (m === 1 && d <= 5);
}
