import { git } from './git.js';
import type { EnvGuardConfig, Finding } from '../types.js';
import { scanText } from '../scanner/scan.js';
export async function scanHistory(
  root: string,
  config: EnvGuardConfig,
  options: { all?: boolean; since?: string; path?: string },
): Promise<Finding[]> {
  const args = ['log', '--format=%H'];
  if (options.all) args.push('--all');
  if (options.since) args.push(`${options.since}..HEAD`);
  if (options.path) args.push('--', options.path);
  const commits = (await git(root, args)).trim().split(/\r?\n/).filter(Boolean);
  const findings: Finding[] = [];
  for (const commit of commits) {
    const files = (await git(root, ['diff-tree', '--no-commit-id', '--name-only', '-r', commit]))
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
    for (const file of files) {
      try {
        const content = await git(root, ['show', `${commit}:${file}`]);
        findings.push(
          ...scanText(file, content, config).map((f) => ({
            ...f,
            file: `${file} @ ${commit.slice(0, 12)}`,
          })),
        );
      } catch {
        /* deleted or binary entry */
      }
    }
  }
  return findings;
}
