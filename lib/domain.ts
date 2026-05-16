export const SEA_TROUT_LEGAL_MIN_CM = 40;

export function deriveUndersized(lengthCm: number | null): boolean {
  return lengthCm === null || lengthCm < SEA_TROUT_LEGAL_MIN_CM;
}
