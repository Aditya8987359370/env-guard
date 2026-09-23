import { describe, expect, it } from 'vitest';
import { allowlistPatterns, customRules, defaults, validateSeverity } from '../src/config/load.js';

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
  it('rejects invalid allowlist patterns and severity values', () => {
    expect(() =>
      allowlistPatterns({ ...defaults, rules: { ...defaults.rules, allowlist: ['['] } }),
    ).toThrow('Invalid allowlist');
    expect(() => validateSeverity('urgent')).toThrow('Invalid severity');
  });
});
