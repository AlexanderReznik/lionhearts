export type BulbColour = 'blue' | 'red' | 'green' | 'white';

export interface FairyBulb {
  cx: number;
  colour: BulbColour;
  delay: number;
}

export interface FairyLights {
  wire: string;
  hangY: number;
  height: number;
  bulbs: FairyBulb[];
}

const COLOURS: BulbColour[] = ['blue', 'red', 'green', 'white'];

export function fairyLights(width: number, spacing: number, bulbHeight: number): FairyLights {
  const sag = spacing / 2;
  const hangY = 0.625 + 0.375 * (1 + sag);

  // Each scallop gets its own Q: a T would mirror the previous control point,
  // so every other scallop would arch up and leave its bulbs hanging in mid-air.
  let wire = 'M0 1';
  for (let x = 0; x < width + spacing; x += 2 * spacing) {
    wire += ` Q ${x + spacing} ${1 + sag} ${x + 2 * spacing} 1`;
  }

  const bulbs = Array.from({ length: Math.ceil(width / spacing) }, (_, i) => ({
    cx: spacing / 2 + i * spacing,
    colour: COLOURS[i % 4],
    delay: (i + Math.floor(i / 4)) % 4,
  }));

  return { wire, hangY, height: Math.ceil(hangY + bulbHeight + 2), bulbs };
}
