import { describe, it, expect } from 'vitest';

/**
 * Smoke test — verifies the test infrastructure is wired correctly.
 * Real component tests are added per-task as components are implemented.
 */
describe('Test infrastructure', () => {
  it('runs tests successfully', () => {
    expect(true).toBe(true);
  });

  it('performs basic arithmetic', () => {
    expect(1 + 1).toBe(2);
  });
});
