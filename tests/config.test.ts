import { describe, expect, it } from 'vitest';
import { customRules, defaults } from '../src/config/load.js';

describe('custom rule configuration', () => {
  it('rejects unsafe custom rule metadata', () => {
    expect(() =>
      customRules({
        ...defaults,
        rules: {
          ...defaults.rules,
          custom: [{ id: 'Invalid rule', description: 'test', pattern: 'x' }],
        },
      }),
    ).toThrow('Invalid custom rule ID');
  });
  it('rejects invalid custom regular expressions', () => {
    expect(() =>
      customRules({
        ...defaults,
        rules: {
          ...defaults.rules,
          custom: [{ id: 'test-rule', description: 'test', pattern: '[' }],
        },
      }),
    ).toThrow('Invalid regular expression');
  });
});
