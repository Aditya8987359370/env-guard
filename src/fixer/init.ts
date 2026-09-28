import { existsSync } from 'node:fs';
import { appendFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
export async function initialize(root: string): Promise<string[]> {
  const changed: string[] = [];
  const gitignore = resolve(root, '.gitignore');
  const example = resolve(root, '.env.example');
  const config = resolve(root, '.envguard.yml');
  if (!existsSync(gitignore)) {
    await writeFile(gitignore, '.env\n.env.*\n!.env.example\n');
    changed.push('created .gitignore');
  } else {
    const current = await (await import('node:fs/promises')).readFile(gitignore, 'utf8');
    if (!current.includes('.env')) {
      await appendFile(gitignore, '\n# EnvGuard\n.env\n.env.*\n!.env.example\n');
      changed.push('updated .gitignore');
    }
  }
  if (!existsSync(example)) {
    await writeFile(
      example,
      '# Copy to .env and set local values. Never commit .env.\nAPI_KEY=YOUR_API_KEY\n',
    );
    changed.push('created .env.example');
  }
  if (!existsSync(config)) {
    await writeFile(
      config,
      'scan:\n  paths:\n    - .\n  maxFileSize: 1048576\n  maxFiles: 10000\nignore:\n  - "**/*.test.ts"\n  - "package-lock.json"\nrules:\n  disabled: []\n  allowlist: []\n  custom: []\n  entropy:\n    enabled: true\n    threshold: 4.0\noutput:\n  maskSecrets: true\n  minSeverity: info\n',
    );
    changed.push('created .envguard.yml');
  }
  return changed;
}

export async function generateExampleEnv(root: string, keys: string[]): Promise<string[]> {
  const example = resolve(root, '.env.example');
  const uniqueKeys = [
    ...new Set(
      keys.map((k) => k.trim()).filter((k) => k.length > 0 && /^[A-Za-z_][A-Za-z0-9_]*$/.test(k)),
    ),
  ];
  if (uniqueKeys.length === 0) return [];
  const added: string[] = [];
  let existingContent = '';
  if (existsSync(example)) {
    const fsPromises = await import('node:fs/promises');
    existingContent = await fsPromises.readFile(example, 'utf8');
  } else {
    existingContent = '# Copy to .env and set local values. Never commit .env.\n';
    await writeFile(example, existingContent, 'utf8');
  }
  const toAppend: string[] = [];
  for (const k of uniqueKeys) {
    if (!new RegExp(`^${k}\\s*=`, 'm').test(existingContent)) {
      toAppend.push(`${k}=YOUR_${k}\n`);
      added.push(k);
    }
  }
  if (toAppend.length > 0) {
    await appendFile(example, (existingContent.endsWith('\n') ? '' : '\n') + toAppend.join(''));
  }
  return added;
}
