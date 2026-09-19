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
      'scan:\n  paths:\n    - .\n  maxFileSize: 1048576\nignore:\n  - "**/*.test.ts"\n  - "package-lock.json"\nrules:\n  disabled: []\n  entropy:\n    enabled: true\n    threshold: 4.0\noutput:\n  maskSecrets: true\n',
    );
    changed.push('created .envguard.yml');
  }
  return changed;
}
