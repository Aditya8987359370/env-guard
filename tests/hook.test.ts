import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';
import { installHook, uninstallHook } from '../src/git/hook.js';

const exec = promisify(execFile);
let tempRoot = '';
afterEach(async () => {
  if (tempRoot) await rm(tempRoot, { recursive: true, force: true });
});

describe('Git hook lifecycle', () => {
  it('preserves and restores a custom pre-commit hook', async () => {
    tempRoot = await mkdtemp(join(tmpdir(), 'envguard-hook-'));
    await exec('git', ['init', tempRoot]);
    const hook = join(tempRoot, '.git', 'hooks', 'pre-commit');
    const original = '#!/bin/sh\necho original hook\n';
    await writeFile(hook, original);
    const entrypoint = 'C:/tools/envguard/dist/index.js';
    await installHook(tempRoot, entrypoint);
    expect(await readFile(`${hook}.envguard-backup`, 'utf8')).toBe(original);
    const installed = await readFile(hook, 'utf8');
    expect(installed).toContain('EnvGuard pre-commit scan');
    expect(installed).toContain(entrypoint);
    expect(await uninstallHook(tempRoot)).toContain('restored');
    expect(await readFile(hook, 'utf8')).toBe(original);
  });
});
