import { describe, expect, it } from 'vitest';
import { calculateNewRatings, getKFactor } from './elo';

describe('getKFactor', () => {
  it('Should return 40 for new players', () => {
    expect(getKFactor(5)).toBe(40);
    expect(getKFactor(10)).toBe(40);
  });
  it('Should return 20 for established players', () => {
    expect(getKFactor(11)).toBe(20);
    expect(getKFactor(20)).toBe(20);
  });
});

describe('calculateNewRatings', () => {
  it('Equal ratings, equal K-factors results in symmetric gain/loss', () => {
    const ratingA = 1200,
      ratingB = 1200;
    const { newRatingA, newRatingB } = calculateNewRatings(
      ratingA,
      ratingB,
      30,
      25,
      true,
    );
    expect(newRatingA - ratingA).toBe(ratingB - newRatingB);
  });

  it('Higher-rated beats lower-rated should result in small gain', () => {
    const { newRatingA } = calculateNewRatings(1600, 1200, 20, 20, true);
    expect(newRatingA - 1600).toBeLessThan(10);
  });

  it('Lower-rated beats higher-rated should result in big gain (upset)', () => {
    const { newRatingB } = calculateNewRatings(1600, 1200, 20, 20, false);
    expect(newRatingB - 1200).toBeGreaterThan(10);
  });

  it('Should round ratings to whole numbers', () => {
    const ratingA = 1500,
      ratingB = 1700;
    const { newRatingA, newRatingB } = calculateNewRatings(
      ratingA,
      ratingB,
      10,
      10,
      false,
    );
    expect(Number.isInteger(newRatingA)).toBe(true);
    expect(Number.isInteger(newRatingB)).toBe(true);
  });
});
