import { describe, expect, it } from 'vitest';
import { terminalReport } from '../src/reporter/report.js';
describe('reporting', () => {
  it('reports clean scans', () =>
    expect(
      terminalReport({ version: 1, scannedFiles: 1, skippedFiles: 0, errors: [], findings: [] }),
    ).toContain('passed'));
});
