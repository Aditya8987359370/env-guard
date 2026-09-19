import { existsSync } from 'node:fs';
import { chmod, copyFile, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { git } from './git.js';
export async function installHook(root: string): Promise<string> {
  const hooks = (await git(root, ['rev-parse', '--git-path', 'hooks'])).trim();
  const hook = resolve(root, hooks, 'pre-commit');
  if (existsSync(hook)) {
    const text = await readFile(hook, 'utf8');
    if (!text.includes('EnvGuard pre-commit scan')) {
      await copyFile(hook, `${hook}.envguard-backup`);
    }
  }
  const script =
    '#!/bin/sh\n# EnvGuard pre-commit scan\nif [ -f "$0.envguard-backup" ]; then\n  "$0.envguard-backup"\n  status=$?\n  [ $status -ne 0 ] && exit $status\nfi\nnode "' +
    resolve(root, 'dist/index.js').replace(/\\/g, '/') +
    '" scan --staged\nstatus=$?\n[ $status -eq 0 ] && echo "EnvGuard scan passed - commit allowed" || echo "EnvGuard blocked the commit"\nexit $status\n';
  await writeFile(hook, script, 'utf8');
  await chmod(hook, 0o755);
  return hook;
}

export async function uninstallHook(root: string): Promise<string> {
  const hooks = (await git(root, ['rev-parse', '--git-path', 'hooks'])).trim();
  const hook = resolve(root, hooks, 'pre-commit');
  const backup = `${hook}.envguard-backup`;
  if (!existsSync(hook)) return 'No pre-commit hook is installed.';
  const text = await readFile(hook, 'utf8');
  if (!text.includes('EnvGuard pre-commit scan'))
    return 'The existing pre-commit hook is not managed by EnvGuard; no changes made.';
  if (existsSync(backup)) {
    await rename(backup, hook);
    return `EnvGuard removed; restored the previous hook at ${hook}`;
  }
  await unlink(hook);
  return 'EnvGuard pre-commit hook removed.';
}
