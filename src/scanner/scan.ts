import { entropyCandidates } from '../detectors/entropy.js';
import { allowlistPatterns, customRules } from '../config/load.js';
import { genericCandidates, genericRule } from '../detectors/generic.js';
import { patternRules } from '../detectors/patterns.js';
import { maskSecret, isPlaceholder } from '../security/mask.js';
import type { EnvGuardConfig, Finding, ScanResult } from '../types.js';
import { collectFiles, type SourceFile } from './files.js';

export function scanContent(file: SourceFile, config: EnvGuardConfig): Finding[] {
  const disabled = new Set(config.rules?.disabled ?? []);
  const configuredPatterns = [...patternRules, ...customRules(config)];
  const allowlist = allowlistPatterns(config);
  const found: Finding[] = [];
  const seen = new Set<string>();
  const add = (
    ruleId: string,
    type: string,
    severity: Finding['severity'],
    value: string,
    line: number,
  ) => {
    if (
      disabled.has(ruleId) ||
      isPlaceholder(value) ||
      allowlist.some((pattern) => pattern.test(value))
    )
      return;
    const key = `${ruleId}:${line}:${value}`;
    if (seen.has(key)) return;
    seen.add(key);
    found.push({
      ruleId,
      type,
      severity,
      file: file.relativePath,
      line,
      maskedValue: maskSecret(value),
      message: `${type} detected. Detection is an estimate; verify and rotate if needed.`,
    });
  };
  file.content.split(/\r?\n/).forEach((line, index) => {
    const lineNo = index + 1;
    for (const rule of configuredPatterns) {
      if (!rule.pattern || disabled.has(rule.id)) continue;
      rule.pattern.lastIndex = 0;
      for (const match of line.matchAll(rule.pattern))
        add(rule.id, rule.type, rule.severity, match[0], lineNo);
    }
    for (const value of genericCandidates(line))
      add(genericRule.id, genericRule.type, genericRule.severity, value, lineNo);
    if (config.rules?.entropy?.enabled !== false)
      for (const value of entropyCandidates(line, config.rules?.entropy?.threshold ?? 4))
        add('high-entropy-value', 'Possible High-Entropy Secret', 'medium', value, lineNo);
  });
  return found;
}

const severityRank: Record<Finding['severity'], number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function filterBySeverity(result: ScanResult, minimum: Finding['severity']): ScanResult {
  return {
    ...result,
    findings: result.findings.filter(
      (finding) => severityRank[finding.severity] >= severityRank[minimum],
    ),
  };
}
export async function scanPaths(
  root: string,
  paths: string[],
  config: EnvGuardConfig,
): Promise<ScanResult> {
  const collection = await collectFiles(root, paths, config);
  return {
    version: 1,
    scannedFiles: collection.files.length,
    skippedFiles: collection.skipped,
    findings: collection.files.flatMap((file) => scanContent(file, config)),
    errors: collection.errors,
  };
}
export function scanText(path: string, content: string, config: EnvGuardConfig): Finding[] {
  return scanContent({ path, relativePath: path, content }, config);
}
export function resolvedScanPaths(
  root: string,
  requested: string[] | undefined,
  config: EnvGuardConfig,
): string[] {
  return requested?.length ? requested : config.scan?.paths?.length ? config.scan.paths : ['.'];
}
