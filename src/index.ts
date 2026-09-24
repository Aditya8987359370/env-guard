#!/usr/bin/env node
import { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import ignore from 'ignore';
import { customRules, loadConfig, validateSeverity } from './config/load.js';
import { initialize } from './fixer/init.js';
import { installHook, uninstallHook } from './git/hook.js';
import { scanHistory } from './git/history.js';
import { stagedContent, stagedFiles } from './git/git.js';
import { terminalReport, sarifReport } from './reporter/report.js';
import { filterBySeverity, resolvedScanPaths, scanPaths, scanText } from './scanner/scan.js';
import { patternRules } from './detectors/patterns.js';
import { genericRule } from './detectors/generic.js';
import type { ScanResult } from './types.js';

const root = process.cwd();
const cliEntrypoint = fileURLToPath(import.meta.url);
function exitFor(result: ScanResult): void {
  process.exitCode = result.findings.length ? 1 : 0;
}
function fail(error: unknown): void {
  console.error(`EnvGuard error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  process.exitCode = 2;
}
async function scanAction(
  paths: string[],
  opts: {
    json?: boolean;
    sarif?: boolean;
    staged?: boolean;
    verbose?: boolean;
    minSeverity?: string;
  },
): Promise<void> {
  const config = loadConfig(root);
  let result: ScanResult;
  if (opts.staged) {
    const matcher = ignore().add(config.ignore ?? []);
    try {
      matcher.add(await readFile(`${root}/.gitignore`, 'utf8'));
    } catch {
      /* no gitignore is normal */
    }
    const files = (await stagedFiles(root)).filter((file) => !matcher.ignores(file));
    const findings = (
      await Promise.all(
        files.map(async (file) => scanText(file, await stagedContent(root, file), config)),
      )
    ).flat();
    result = { version: 1, scannedFiles: files.length, skippedFiles: 0, findings, errors: [] };
  } else result = await scanPaths(root, resolvedScanPaths(root, paths, config), config);
  const filtered = filterBySeverity(
    result,
    validateSeverity(opts.minSeverity ?? config.output?.minSeverity ?? 'info'),
  );
  console.log(
    opts.sarif
      ? JSON.stringify(sarifReport(filtered), null, 2)
      : opts.json
        ? JSON.stringify(filtered, null, 2)
        : terminalReport(filtered, opts.verbose),
  );
  exitFor(filtered);
}
const program = new Command();
program
  .name('envguard')
  .description('Protect your secrets before they reach Git. All scans run locally.')
  .version('1.4.0')
  .showSuggestionAfterError();
program
  .command('scan [paths...]')
  .description('Scan files or directories for possible secrets.')
  .option('--json', 'print versioned JSON without raw secrets')
  .option('--sarif', 'print SARIF 2.1.0 without raw secrets')
  .option('--staged', 'scan staged Git content only (for hooks)')
  .option('--verbose', 'include skipped-file and non-fatal read warnings')
  .option(
    '--min-severity <severity>',
    'only report findings at or above: info, low, medium, high, critical',
  )
  .action(async (paths, opts) => {
    try {
      await scanAction(paths, opts);
    } catch (error) {
      fail(error);
    }
  });
program
  .command('init')
  .description('Create safe starter files without overwriting existing files.')
  .action(async () => {
    try {
      const changed = await initialize(root);
      console.log(
        changed.length
          ? `EnvGuard initialized: ${changed.join(', ')}`
          : 'EnvGuard is already configured; no files changed.',
      );
    } catch (error) {
      fail(error);
    }
  });
program
  .command('install-hook')
  .description('Install the local Git pre-commit hook; preserves a custom hook.')
  .action(async () => {
    try {
      console.log(`EnvGuard hook installed: ${await installHook(root, cliEntrypoint)}`);
    } catch (error) {
      fail(error);
    }
  });
program
  .command('uninstall-hook')
  .description('Remove the EnvGuard hook and restore a preserved custom hook.')
  .action(async () => {
    try {
      console.log(await uninstallHook(root));
    } catch (error) {
      fail(error);
    }
  });
program
  .command('history')
  .description('Scan Git history; detection does not prove validity.')
  .option('--all', 'scan all refs')
  .option('--since <commit>', 'scan commits after this commit')
  .option('--path <file>', 'limit scanning to a path')
  .option('--json', 'print JSON')
  .option(
    '--min-severity <severity>',
    'only report findings at or above: info, low, medium, high, critical',
  )
  .action(async (opts) => {
    try {
      const config = loadConfig(root);
      const findings = await scanHistory(root, config, opts);
      const result: ScanResult = {
        version: 1,
        scannedFiles: 0,
        skippedFiles: 0,
        findings,
        errors: [],
      };
      const filtered = filterBySeverity(
        result,
        validateSeverity(opts.minSeverity ?? config.output?.minSeverity ?? 'info'),
      );
      console.log(opts.json ? JSON.stringify(filtered, null, 2) : terminalReport(filtered));
      exitFor(filtered);
    } catch (error) {
      fail(error);
    }
  });
program
  .command('rules')
  .description('List built-in detection rules.')
  .option('--json', 'print JSON')
  .action((opts) => {
    try {
      const rules = [
        ...patternRules,
        genericRule,
        {
          id: 'high-entropy-value',
          description: 'Random-looking credential candidate with context',
          type: 'Possible High-Entropy Secret',
          severity: 'medium' as const,
          category: 'entropy' as const,
        },
        ...customRules(loadConfig(root)),
      ];
      console.log(
        opts.json
          ? JSON.stringify(
              rules.map(({ pattern, ...rule }) => ({ ...rule, pattern: pattern?.source })),
              null,
              2,
            )
          : rules
              .map((rule) => `${rule.id}\t${rule.severity}\t${rule.category}\t${rule.description}`)
              .join('\n'),
      );
    } catch (error) {
      fail(error);
    }
  });
program
  .command('fix')
  .description('Show safe remediation guidance; never rewrites source or Git history.')
  .action(() => {
    console.log(
      'Safe remediation: rotate/revoke the credential, move it to an environment variable, add .env to .gitignore, update .env.example, and clean history only after reviewing Git documentation. Run `envguard init` to create missing safe starter files.',
    );
  });
program.parseAsync().catch(fail);
