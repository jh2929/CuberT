import { describe, it, expect } from 'vitest';
import {
  generateLuckyScramble,
  shouldGenerateLuckyScramble,
} from './luckyScramble';

describe('Lucky Scramble Generator', () => {
  it('should never trigger when disabled', () => {
    for (let i = 0; i < 50; i++) {
      expect(shouldGenerateLuckyScramble(false)).toBe(false);
    }
  });

  it('should generate valid moves in lucky scrambles', () => {
    const scramble = generateLuckyScramble('333');
    expect(scramble).toBeDefined();
    expect(typeof scramble).toBe('string');
    const tokens = scramble.split(' ');
    expect(tokens.length).toBeGreaterThanOrEqual(6);
    expect(tokens.length).toBeLessThanOrEqual(22);

    const validMoveRegex = /^[RLUDFBxyz](w)?(')?(2)?$/;
    for (const move of tokens) {
      expect(validMoveRegex.test(move)).toBe(true);
    }
  });

  it('should respect level 0 as never triggering', () => {
    for (let i = 0; i < 50; i++) {
      expect(shouldGenerateLuckyScramble(true, 0)).toBe(false);
    }
  });

  it('should generate ultra-lucky scrambles for level 4 using only R and U triggers', () => {
    const scramble = generateLuckyScramble('333', 4);
    expect(scramble).toBeDefined();
    const tokens = scramble.split(' ');
    // Ultra-lucky uses moves only from R and U faces
    for (const move of tokens) {
      expect(['R', "R'", 'R2', 'U', "U'", 'U2']).toContain(move);
    }
  });
});
