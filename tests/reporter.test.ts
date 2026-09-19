import { describe, expect, it } from 'vitest';
import { terminalReport } from '../src/reporter/report.js';
describe('reporting', () => {
  it('reports clean scans', () =>
    expect(
      terminalReport({ version: 1, scannedFiles: 1, skippedFiles: 0, errors: [], findings: [] }),
    ).toContain('passed'));
  it('shows skip and warning details only in verbose mode', () => {
    const result = {
      version: 1 as const,
      scannedFiles: 2,
      skippedFiles: 1,
      errors: ['Could not scan locked.txt'],
      findings: [],
    };
    expect(terminalReport(result)).not.toContain('locked.txt');
    expect(terminalReport(result, true)).toContain('Skipped: 1');
    expect(terminalReport(result, true)).toContain('locked.txt');
  });
});
