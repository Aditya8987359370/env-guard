import type { Finding, ScanResult } from '../types.js';
const level: Record<Finding['severity'], string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
  info: 'INFO',
};
export function terminalReport(result: ScanResult, verbose = false): string {
  const summary = `Scanned: ${result.scannedFiles} file(s).${verbose ? ` Skipped: ${result.skippedFiles}.` : ''}`;
  if (result.findings.length === 0) {
    const errors =
      verbose && result.errors.length
        ? `\nWarnings:\n${result.errors.map((error) => `  - ${error}`).join('\n')}`
        : '';
    return `EnvGuard scan passed. ${summary}${errors}`;
  }
  const counts: Record<Finding['severity'], number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  for (const f of result.findings) counts[f.severity]++;
  const breakdown = ` (Critical: ${counts.critical}, High: ${counts.high}, Medium: ${counts.medium})`;

  const rows = result.findings.map((f) => {
    const revoke = f.revokeUrl ? `\n  Revoke: ${f.revokeUrl}` : '';
    return `${f.file}:${f.line}\n  ${f.type} [${level[f.severity]}]\n  Value: ${f.maskedValue}${revoke}`;
  });
  const errors =
    verbose && result.errors.length
      ? `\nWarnings:\n${result.errors.map((error) => `  - ${error}`).join('\n')}`
      : '';
  return `EnvGuard found ${result.findings.length} possible secret(s). ${summary}${breakdown}\n${rows.join('\n')}\n\nRotate or revoke exposed credentials, remove them from source, and prevent future commits.${errors}`;
}
export function sarifReport(result: ScanResult): object {
  const rules = [...new Map(result.findings.map((f) => [f.ruleId, f])).values()].map((f) => ({
    id: f.ruleId,
    shortDescription: { text: f.type },
    ...(f.revokeUrl ? { helpUri: f.revokeUrl } : {}),
    defaultConfiguration: {
      level: f.severity === 'critical' || f.severity === 'high' ? 'error' : 'warning',
    },
  }));
  return {
    version: '2.1.0',
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    runs: [
      {
        tool: { driver: { name: 'EnvGuard', rules } },
        results: result.findings.map((f) => ({
          ruleId: f.ruleId,
          level: f.severity === 'critical' || f.severity === 'high' ? 'error' : 'warning',
          message: { text: `${f.type}; value ${f.maskedValue}` },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: f.file },
                region: { startLine: f.line },
              },
            },
          ],
        })),
      },
    ],
  };
}
