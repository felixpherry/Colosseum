export function calculateTotalRounds(size: number): number {
  return Math.ceil(Math.log2(size));
}
