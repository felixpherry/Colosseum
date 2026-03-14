import { describe, expect, it } from 'vitest';
import { generateSlug } from './slug';

describe('generateSlug', () => {
  // Normal input
  it('Should handle normal input', () => {
    expect(generateSlug('Hello World')).toContain('hello-world');
  });
  // Special characters
  it('Should handle special character', () => {
    expect(generateSlug('Hello@ World@@')).toContain('hello-world');
  });
  // Multiple spaces
  it('Should handle multiple spaces', () => {
    expect(generateSlug('Hello      World')).toContain('hello-world');
  });
  // Leading/trailing hyphens
  it('Should handle leading and trailing hyphens', () => {
    expect(generateSlug('--Hello World--')).toContain('hello-world');
  });
  // Empty-ish input
  it('Should handle multiple empty-ish input', () => {
    expect(() => generateSlug('-@')).toThrow();
  });
  // The random suffix exists and is 4 characters
  it('Should have random suffix exists and is 4 characters', () => {
    const slug = generateSlug('Hello World');
    expect(slug.split('-').at(-1)).toHaveLength(4);
  });
});
