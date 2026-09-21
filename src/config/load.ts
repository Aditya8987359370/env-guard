import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import YAML from 'yaml';
import type { EnvGuardConfig, Rule, Severity } from '../types.js';

export const defaults: Required<Pick<EnvGuardConfig, 'scan' | 'ignore' | 'rules' | 'output'>> = {
  scan: { paths: ['.'], maxFileSize: 1024 * 1024, maxFiles: 10_000 },
  ignore: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    'coverage/**',
    'vendor/**',
    '.cache/**',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
  ],
  rules: { disabled: [], entropy: { enabled: true, threshold: 4.0 }, custom: [] },
  output: { maskSecrets: true },
};
export function loadConfig(root: string): EnvGuardConfig {
  const file = resolve(root, '.envguard.yml');
  if (!existsSync(file)) return defaults;
  const parsed = YAML.parse(readFileSync(file, 'utf8'));
  if (!parsed || typeof parsed !== 'object')
    throw new Error('Invalid .envguard.yml: expected a YAML object.');
  return {
    ...defaults,
    ...parsed,
    scan: { ...defaults.scan, ...(parsed.scan ?? {}) },
    ignore: [...defaults.ignore, ...(parsed.ignore ?? [])],
    rules: {
      ...defaults.rules,
      ...(parsed.rules ?? {}),
      entropy: { ...defaults.rules.entropy, ...(parsed.rules?.entropy ?? {}) },
      custom: parsed.rules?.custom ?? defaults.rules.custom,
    },
    output: { ...defaults.output, ...(parsed.output ?? {}) },
  };
}

export function customRules(config: EnvGuardConfig): Rule[] {
  return (config.rules?.custom ?? []).map((rule) => {
    if (!/^[a-z][a-z0-9-]{1,63}$/.test(rule.id))
      throw new Error(
        `Invalid custom rule ID "${rule.id}". Use lowercase letters, numbers, and hyphens.`,
      );
    if (!rule.description || !rule.pattern || rule.pattern.length > 512)
      throw new Error(
        `Invalid custom rule "${rule.id}". Description and a pattern of 512 characters or fewer are required.`,
      );
    let pattern: RegExp;
    try {
      pattern = new RegExp(rule.pattern, 'g');
    } catch {
      throw new Error(`Invalid regular expression in custom rule "${rule.id}".`);
    }
    const severity: Severity = rule.severity ?? 'medium';
    if (!['critical', 'high', 'medium', 'low', 'info'].includes(severity))
      throw new Error(`Invalid severity in custom rule "${rule.id}".`);
    return {
      id: rule.id,
      description: rule.description,
      type: rule.type ?? `Possible ${rule.description}`,
      severity,
      category: 'custom',
      pattern,
    };
  });
}
