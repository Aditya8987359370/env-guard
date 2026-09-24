import type { Rule } from '../types.js';
export const genericRule: Rule = {
  id: 'generic-credential',
  description: 'Credential-looking assignment',
  type: 'Possible Credential',
  severity: 'high',
  category: 'generic',
};
const key =
  '(?:api[_-]?(?:key|token)|access[_-]?token|auth(?:entication)?[_-]?token|secret|password|private[_-]?key|database[_-]?(?:url|password)|connection[_-]?string|client[_-]?secret|session[_-]?secret|jwt[_-]?secret|webhook[_-]?secret|encryption[_-]?key|aws[_-]?secret(?:[_-]?access)?[_-]?key)';
const assignment = new RegExp(
  `(?:["']?${key}["']?\\s*(?:=|:|=>)\\s*["']?)([^\\s"',;}` + '`' + `]{6,})`,
  'ig',
);
export function genericCandidates(line: string): string[] {
  return [...line.matchAll(assignment)].map((m) => m[1]);
}
