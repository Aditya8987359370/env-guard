import { describe, expect, it } from 'vitest';
import { defaults } from '../src/config/load.js';
import { entropyCandidates, shannonEntropy } from '../src/detectors/entropy.js';
import { maskSecret } from '../src/security/mask.js';
import { sarifReport } from '../src/reporter/report.js';
import { scanText } from '../src/scanner/scan.js';
const cfg = { ...defaults, rules: { ...defaults.rules, entropy: { enabled: true, threshold: 4 } } };
describe('detection and redaction', () => {
  it('finds known patterns and never returns their raw values', () => {
    const raw = 'ghp_abcdefghijklmnopqrstuvwxyz1234567890';
    const findings = scanText('src/a.ts', `const token = '${raw}'`, cfg);
    expect(findings.some((f) => f.ruleId === 'github-token')).toBe(true);
    expect(JSON.stringify(findings)).not.toContain(raw);
  });
  it('finds generic assignments but ignores placeholders', () => {
    expect(
      scanText('a.env', 'API_KEY=abCDef123456', cfg).some((f) => f.ruleId === 'generic-credential'),
    ).toBe(true);
    expect(scanText('a.env', 'API_KEY=YOUR_API_KEY', cfg)).toHaveLength(0);
  });
  it('calculates entropy and finds contextual random candidates', () => {
    expect(shannonEntropy('aaaaaaaa')).toBeLessThan(1);
    expect(entropyCandidates('TOKEN=q9ZkL2xR8mV4pT7wN1yB6cD3', 3.5)).toHaveLength(1);
  });
  it('does not treat domain paths as high-entropy secrets', () => {
    expect(entropyCandidates('https://github.com/Aditya8987359370/env-guard', 3.5)).toHaveLength(0);
  });
  it('masks short and long strings', () => {
    expect(maskSecret('abc')).toBe('********');
    expect(maskSecret('abcdefghijklmnop')).not.toContain('efghijkl');
  });
  it('never emits a raw secret in SARIF', () => {
    const raw = 'AKIA1234567890ABCDEF';
    const result = {
      version: 1 as const,
      scannedFiles: 1,
      skippedFiles: 0,
      errors: [],
      findings: scanText('a.env', raw, cfg),
    };
    expect(JSON.stringify(sarifReport(result))).not.toContain(raw);
  });
  it('honours disabled rules', () => {
    const findings = scanText('a.ts', 'AKIA1234567890ABCDEF', {
      ...cfg,
      rules: { ...cfg.rules, disabled: ['aws-access-key'] },
    });
    expect(findings.some((f) => f.ruleId === 'aws-access-key')).toBe(false);
  });
});
