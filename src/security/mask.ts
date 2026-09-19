/** Never return a raw candidate from reporters, errors, or public APIs. */
export function maskSecret(value: string): string {
  const compact = value.trim();
  if (compact.length <= 4) return '********';
  if (compact.length <= 10) return `${compact.slice(0, 2)}********`;
  return `${compact.slice(0, 4)}${'*'.repeat(Math.min(12, compact.length - 6))}${compact.slice(-2)}`;
}

export function isPlaceholder(value: string): boolean {
  return (
    /^(?:your[_-]?|change[_-]?|example[_-]?|test[_-]?|dummy|fake|xxx|<[^>]+>)/i.test(
      value.trim(),
    ) || /(?:YOUR_API_KEY|sk-example|example-secret|test-token)/i.test(value)
  );
}
