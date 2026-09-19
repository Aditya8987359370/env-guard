import type { Rule } from '../types.js';

export const patternRules: Rule[] = [
  { id: 'aws-access-key', description: 'Potential AWS access key ID', type: 'Possible AWS Access Key', severity: 'high', category: 'pattern', pattern: /\b(?:AKIA|ASIA|ABIA|ACCA)[A-Z0-9]{16}\b/g },
  { id: 'github-token', description: 'Potential GitHub personal or fine-grained token', type: 'Possible GitHub Token', severity: 'critical', category: 'pattern', pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,255}\b/g },
  { id: 'google-api-key', description: 'Potential Google API key', type: 'Possible Google API Key', severity: 'high', category: 'pattern', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { id: 'stripe-key', description: 'Potential Stripe key', type: 'Possible Stripe Key', severity: 'critical', category: 'pattern', pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g },
  { id: 'slack-token', description: 'Potential Slack token', type: 'Possible Slack Token', severity: 'high', category: 'pattern', pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { id: 'jwt', description: 'Potential JSON Web Token', type: 'Possible JWT', severity: 'medium', category: 'pattern', pattern: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g },
  { id: 'private-key', description: 'Private key material', type: 'Possible Private Key', severity: 'critical', category: 'pattern', pattern: /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/g },
  { id: 'bearer-token', description: 'Potential bearer token', type: 'Possible Bearer Token', severity: 'high', category: 'pattern', pattern: /\bBearer\s+[A-Za-z0-9._~+/-]{20,}/g },
];
