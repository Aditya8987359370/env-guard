import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import YAML from 'yaml';
import type { EnvGuardConfig } from '../types.js';

export const defaults: Required<Pick<EnvGuardConfig, 'ignore' | 'rules' | 'output'>> = {
  ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**', 'coverage/**', 'vendor/**', '.cache/**', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
  rules: { disabled: [], entropy: { enabled: true, threshold: 4.0 } },
  output: { maskSecrets: true },
};
export function loadConfig(root: string): EnvGuardConfig {
  const file = resolve(root, '.envguard.yml');
  if (!existsSync(file)) return defaults;
  const parsed = YAML.parse(readFileSync(file, 'utf8'));
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid .envguard.yml: expected a YAML object.');
  return { ...defaults, ...parsed, ignore: [...defaults.ignore, ...(parsed.ignore ?? [])], rules: { ...defaults.rules, ...(parsed.rules ?? {}), entropy: { ...defaults.rules.entropy, ...(parsed.rules?.entropy ?? {}) } }, output: { ...defaults.output, ...(parsed.output ?? {}) } };
}
