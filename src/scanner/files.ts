import { lstat, readdir, readFile, realpath } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import ignore from 'ignore';
import type { EnvGuardConfig } from '../types.js';

export type SourceFile = { path: string; relativePath: string; content: string };
export type FileCollection = { files: SourceFile[]; skipped: number; errors: string[] };
const DEFAULT_MAX_BYTES = 1024 * 1024;
const binary = (data: Buffer) => data.subarray(0, 8192).includes(0);

export async function collectFiles(
  root: string,
  paths: string[],
  config: EnvGuardConfig,
): Promise<FileCollection> {
  const matcher = ignore().add(config.ignore ?? []);
  try {
    const gitignore = await readFile(resolve(root, '.gitignore'), 'utf8');
    matcher.add(gitignore);
  } catch {
    /* no gitignore is normal */
  }
  const result: FileCollection = { files: [], skipped: 0, errors: [] };
  const seen = new Set<string>();
  async function visit(candidate: string): Promise<void> {
    let stat;
    try {
      stat = await lstat(candidate);
    } catch {
      result.errors.push(`Could not read ${relative(root, candidate)}`);
      return;
    }
    if (stat.isSymbolicLink()) {
      result.skipped++;
      return;
    }
    const rel = relative(root, candidate).split(sep).join('/');
    if (rel && matcher.ignores(rel + (stat.isDirectory() ? '/' : ''))) {
      result.skipped++;
      return;
    }
    if (stat.isDirectory()) {
      const real = await realpath(candidate).catch(() => candidate);
      if (seen.has(real)) return;
      seen.add(real);
      const entries = await readdir(candidate).catch(() => []);
      await Promise.all(entries.map((entry) => visit(resolve(candidate, entry))));
      return;
    }
    if (!stat.isFile() || stat.size > (config.scan?.maxFileSize ?? DEFAULT_MAX_BYTES)) {
      result.skipped++;
      return;
    }
    try {
      const data = await readFile(candidate);
      if (binary(data)) {
        result.skipped++;
        return;
      }
      result.files.push({ path: candidate, relativePath: rel, content: data.toString('utf8') });
    } catch {
      result.errors.push(`Could not scan ${rel}`);
    }
  }
  await Promise.all(paths.map((path) => visit(resolve(root, path))));
  return result;
}
