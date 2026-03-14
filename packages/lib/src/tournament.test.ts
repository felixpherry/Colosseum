import { describe, expect, it } from 'vitest';
import { calculateTotalRounds } from './tournament';

describe('calculateTotalRounds', () => {
  it('Should return 3 with size 8', () => {
    expect(calculateTotalRounds(8)).toBe(3);
  });
  it('Should return 4 with size 16', () => {
    expect(calculateTotalRounds(16)).toBe(4);
  });
  it('Should return 5 with size 32', () => {
    expect(calculateTotalRounds(32)).toBe(5);
  });
  it('Should return 6 with size 64', () => {
    expect(calculateTotalRounds(64)).toBe(6);
  });
});
