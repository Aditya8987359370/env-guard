export function shannonEntropy(value: string): number {
  if (!value) return 0;
  const counts = new Map<string, number>();
  for (const char of value) counts.set(char, (counts.get(char) ?? 0) + 1);
  return [...counts.values()].reduce((sum, n) => { const p = n / value.length; return sum - p * Math.log2(p); }, 0);
}
export function entropyCandidates(line: string, threshold: number): string[] {
  return (line.match(/[A-Za-z0-9+/_=-]{20,}/g) ?? []).filter((value) => {
    if (/^(?:sha(?:1|256|384|512)-|https?:\/\/|github\/)/i.test(value)) return false;
    return /[A-Za-z]/.test(value) && /[0-9+/_=-]/.test(value) && shannonEntropy(value) >= threshold;
  });
}
