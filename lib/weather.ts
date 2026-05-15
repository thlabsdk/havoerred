const CARDINALS = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'] as const;

export type Cardinal = (typeof CARDINALS)[number];

export function degreeToCardinal(deg: number | null | undefined): Cardinal | null {
  if (deg === null || deg === undefined || !Number.isFinite(deg)) return null;
  const norm = ((deg % 360) + 360) % 360;
  const idx = Math.round(norm / 45) % 8;
  return CARDINALS[idx];
}

const WEATHER_CODE_DA: Record<number, string> = {
  0: 'Klart',
  1: 'Mest klart',
  2: 'Delvist skyet',
  3: 'Overskyet',
  45: 'Tåge',
  48: 'Tåge med rim',
  51: 'Let støvregn',
  53: 'Støvregn',
  55: 'Kraftig støvregn',
  61: 'Let regn',
  63: 'Regn',
  65: 'Kraftig regn',
  71: 'Let sne',
  73: 'Sne',
  75: 'Kraftig sne',
  80: 'Regnbyger',
  81: 'Kraftige regnbyger',
  82: 'Voldsomme regnbyger',
  95: 'Tordenvejr',
  96: 'Tordenvejr med hagl',
  99: 'Voldsomt tordenvejr',
};

export function describeWeatherCode(code: string | number | null | undefined): string | null {
  if (code === null || code === undefined) return null;
  const n = typeof code === 'string' ? parseInt(code, 10) : code;
  if (!Number.isFinite(n)) return null;
  return WEATHER_CODE_DA[n] ?? null;
}
