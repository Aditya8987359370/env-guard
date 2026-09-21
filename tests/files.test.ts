import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { defaults } from '../src/config/load.js';
import { collectFiles } from '../src/scanner/files.js';

let tempRoot = '';
afterEach(async () => {
  if (tempRoot) await rm(tempRoot, { recursive: true, force: true });
});

describe('safe file collection', () => {
  it('stops after the configured maximum file count', async () => {
    tempRoot = await mkdtemp(join(tmpdir(), 'envguard-files-'));
    await Promise.all(
      ['one.txt', 'two.txt', 'three.txt'].map((file) => writeFile(join(tempRoot, file), 'safe')),
    );
    const result = await collectFiles(tempRoot, ['.'], {
      ...defaults,
      scan: { ...defaults.scan, maxFiles: 2 },
    });
    expect(result.files).toHaveLength(2);
    expect(result.skipped).toBeGreaterThan(0);
  });
});
