import { describe, expect, it } from 'vitest';
import { defaults } from '../src/config/load.js';
import { entropyCandidates, shannonEntropy } from '../src/detectors/entropy.js';
import { maskSecret } from '../src/security/mask.js';
import { sarifReport } from '../src/reporter/report.js';
import { filterBySeverity, scanText } from '../src/scanner/scan.js';
const cfg = { ...defaults, rules: { ...defaults.rules, entropy: { enabled: true, threshold: 4 } } };
describe('detection and redaction', () => {
  it('finds known patterns and never returns their raw values', () => {
    const raw = 'ghp_abcdefghijklmnopqrstuvwxyz1234567890';
    const findings = scanText('src/a.ts', `const token = '${raw}'`, cfg);
    expect(findings.some((f) => f.ruleId === 'github-token')).toBe(true);
    expect(JSON.stringify(findings)).not.toContain(raw);
  });
  it('finds GitLab, npm, and database credential formats', () => {
    const gitlab = 'glpat-abcdefghijklmnopqrstuvwxyz123456';
    const npm = 'npm_abcdefghijklmnopqrstuvwxyz0123456789';
    const database = 'postgres://demo:fake-password@localhost:5432/app';
    const findings = scanText('config.env', `${gitlab}\n${npm}\n${database}`, cfg);
    expect(findings.map((finding) => finding.ruleId)).toEqual(
      expect.arrayContaining(['gitlab-token', 'npm-token', 'database-connection-string']),
    );
    expect(JSON.stringify(findings)).not.toContain(database);
  });
  it('finds generic assignments but ignores placeholders', () => {
    expect(
      scanText('a.env', 'API_KEY=abCDef123456', cfg).some((f) => f.ruleId === 'generic-credential'),
    ).toBe(true);
    expect(scanText('a.env', 'API_KEY=YOUR_API_KEY', cfg)).toHaveLength(0);
  });
  it('applies a validated custom rule from configuration', () => {
    const value = 'INTERNAL_TOKEN_42';
    const findings = scanText('config.txt', value, {
      ...cfg,
      rules: {
        ...cfg.rules,
        custom: [
          {
            id: 'internal-token',
            description: 'internal token',
            type: 'Possible Internal Token',
            severity: 'high',
            pattern: 'INTERNAL_TOKEN_[0-9]+',
          },
        ],
      },
    });
    expect(findings.some((finding) => finding.ruleId === 'internal-token')).toBe(true);
    expect(JSON.stringify(findings)).not.toContain(value);
  });
  it('suppresses a known-safe candidate with an allowlist pattern', () => {
    const raw = 'AKIA1234567890ABCDEF';
    const findings = scanText('example.txt', raw, {
      ...cfg,
      rules: { ...cfg.rules, allowlist: ['^AKIA1234567890ABCDEF$'] },
    });
    expect(findings.some((finding) => finding.ruleId === 'aws-access-key')).toBe(false);
  });
  it('filters findings below a selected severity threshold', () => {
    const result = {
      version: 1 as const,
      scannedFiles: 1,
      skippedFiles: 0,
      errors: [],
      findings: scanText('a.env', 'API_KEY=abCDef123456', cfg),
    };
    expect(filterBySeverity(result, 'critical').findings).toHaveLength(0);
    expect(filterBySeverity(result, 'high').findings.length).toBeGreaterThan(0);
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
  it('detects modern AI keys (OpenAI, Anthropic, Hugging Face)', () => {
    const openai = ['sk-proj-', 'abc123DEF456ghi789JKL012mno345PQR678stu901VWX'].join('');
    const anthropic = ['sk-ant-api03-', 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEF012345'].join(
      '',
    );
    const hf = ['hf_', 'abcdefghijklmnopqrstuvwxyz01234567'].join('');
    const text = `OPENAI=${openai}\nANTHROPIC=${anthropic}\nHF=${hf}`;
    const findings = scanText('ai.env', text, cfg);
    expect(findings.map((f) => f.ruleId)).toEqual(
      expect.arrayContaining(['openai-api-key', 'anthropic-api-key', 'huggingface-token']),
    );
    expect(JSON.stringify(findings)).not.toContain(openai);
    expect(JSON.stringify(findings)).not.toContain(anthropic);
    expect(JSON.stringify(findings)).not.toContain(hf);
  });
  it('detects developer messaging and email keys (SendGrid, Resend, Twilio)', () => {
    const sendgrid = [
      'SG.',
      '1234567890123456789012.',
      '1234567890123456789012345678901234567890123',
    ].join('');
    const resend = ['re_', '1234567890abcdefghijklmnopqrstuvwxyz'].join('');
    const twilio = ['AC', '0123456789abcdef0123456789abcdef'].join('');
    const text = `SENDGRID=${sendgrid}\nRESEND=${resend}\nTWILIO=${twilio}`;
    const findings = scanText('comm.env', text, cfg);
    expect(findings.map((f) => f.ruleId)).toEqual(
      expect.arrayContaining(['sendgrid-api-key', 'resend-api-key', 'twilio-account-sid']),
    );
  });
  it('detects extended generic credentials like webhook_secret and session_secret', () => {
    const text =
      'WEBHOOK_SECRET=production_webhook_secret_999\nSESSION_SECRET=secure_session_key_12345';
    const findings = scanText('.env', text, cfg);
    expect(findings.filter((f) => f.ruleId === 'generic-credential')).toHaveLength(2);
  });
  it('ignores extended placeholder candidates', () => {
    const text =
      'API_KEY=insert_here_api_key\nSECRET=replace_me_with_secret\nKEY=sample-placeholder';
    const findings = scanText('.env', text, cfg);
    expect(findings).toHaveLength(0);
  });
});
