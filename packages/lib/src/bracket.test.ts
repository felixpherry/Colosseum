import { describe, expect, it } from 'vitest';
import {
  calculateBracketSize,
  generateBracketData,
  generateSeedOrder,
} from './bracket';

describe('generateSeedOrder', () => {
  it('Should return correct seeds order with size 8', () => {
    expect(generateSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });
  it('Should have all adjacent pairs sum to bracketSize + 1', () => {
    const seeds = generateSeedOrder(64);
    for (let i = 0; i < 64; i += 2) {
      expect(seeds[i] + seeds[i + 1]).toBe(65);
    }
  });
});

describe('calculateBracketSize', () => {
  it('Should return 32 with entry counts of 20', () => {
    expect(calculateBracketSize(20)).toBe(32);
  });
  it('Should return 64 with entry counts of 64', () => {
    expect(calculateBracketSize(64)).toBe(64);
  });
  it('Should throw with entry counts < 3', () => {
    expect(() => calculateBracketSize(2)).toThrow();
  });
});

describe('generateBracketData', () => {
  function generateSubmissions(n: number) {
    const submissions: { id: string }[] = [];
    for (let i = 1; i <= n; i++) {
      submissions.push({ id: crypto.randomUUID() });
    }
    return submissions;
  }
  it('Should return 15 matchup count for bracket size 16', () => {
    const submissions = generateSubmissions(10);
    expect(generateBracketData(submissions, 16).length).toBe(15);
  });
  it('Should have all bye matchups to have a winner and no entryB', () => {
    const submissions = generateSubmissions(5);
    const matchups = generateBracketData(submissions, 8);
    for (const matchup of matchups) {
      if (matchup.isBye) {
        expect(matchup.winnerId).not.toBe(null);
        expect(matchup.entryBId).toBe(null);
      }
    }
  });
  it('Should auto-shrink to the smallest bracketSize', () => {
    const submissions = generateSubmissions(10);
    expect(generateBracketData(submissions, 32).length).toBe(15);
  });
});
