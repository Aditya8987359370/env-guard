import { existsSync } from 'node:fs';
import { chmod, copyFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { git } from './git.js';
export async function installHook(root: string): Promise<string> {
  const hooks = (await git(root, ['rev-parse', '--git-path', 'hooks'])).trim(); const hook = resolve(root, hooks, 'pre-commit');
  if (existsSync(hook)) { const text = await (await import('node:fs/promises')).readFile(hook, 'utf8'); if (!text.includes('EnvGuard pre-commit scan')) { await copyFile(hook, `${hook}.envguard-backup`); } }
  const script = '#!/bin/sh\n# EnvGuard pre-commit scan\nnode "' + resolve(root, 'dist/index.js').replace(/\\/g, '/') + '" scan --staged\nstatus=$?\n[ $status -eq 0 ] && echo "EnvGuard scan passed - commit allowed" || echo "EnvGuard blocked the commit"\nexit $status\n';
  await writeFile(hook, script, 'utf8'); await chmod(hook, 0o755); return hook;
}
