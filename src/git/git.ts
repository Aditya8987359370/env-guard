import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
export async function git(root: string, args: string[]): Promise<string> {
  const { stdout } = await exec('git', ['-C', root, ...args], { maxBuffer: 20 * 1024 * 1024 });
  return stdout;
}
export async function stagedFiles(root: string): Promise<string[]> {
  return (await git(root, ['diff', '--cached', '--name-only', '-z'])).split('\0').filter(Boolean);
}
export async function stagedContent(root: string, file: string): Promise<string> {
  return git(root, ['show', `:${file}`]);
}
