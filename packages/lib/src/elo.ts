export function getKFactor(matchesPlayed: number): number {
  return matchesPlayed <= 10 ? 40 : 20;
}

export function calculateExpectedScore(
  ratingA: number,
  ratingB: number,
): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function calculateNewRatings(
  ratingA: number,
  ratingB: number,
  matchesPlayedA: number,
  matchesPlayedB: number,
  aWon: boolean,
): { newRatingA: number; newRatingB: number } {
  const KFactorA = getKFactor(matchesPlayedA);
  const KFactorB = getKFactor(matchesPlayedB);
  const expectedScoreA = calculateExpectedScore(ratingA, ratingB);
  const expectedScoreB = 1 - expectedScoreA;
  const newRatingA = Math.round(
    ratingA + KFactorA * ((aWon ? 1 : 0) - expectedScoreA),
  );
  const newRatingB = Math.round(
    ratingB + KFactorB * ((aWon ? 0 : 1) - expectedScoreB),
  );
  return {
    newRatingA,
    newRatingB,
  };
}
