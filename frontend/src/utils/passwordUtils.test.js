import { describe, it, expect } from 'vitest';
import { generateRandomPassword } from './passwordUtils';

describe('Password Utilities', () => {
  it('generates a 10-character password', () => {
    const pwd = generateRandomPassword();
    expect(pwd.length).toBe(10);
  });

  it('generates strings without easily confused characters (O, 0, I, l)', () => {
    const pwd = generateRandomPassword();
    expect(pwd).not.toMatch(/[O0Il]/);
  });

  it('generates unique passwords on consecutive calls', () => {
    const pwd1 = generateRandomPassword();
    const pwd2 = generateRandomPassword();
    expect(pwd1).not.toBe(pwd2);
  });
});
