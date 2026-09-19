export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Finding = {
  ruleId: string;
  type: string;
  severity: Severity;
  file: string;
  line: number;
  maskedValue: string;
  message: string;
};
export type Rule = {
  id: string;
  description: string;
  type: string;
  severity: Severity;
  category: 'pattern' | 'generic' | 'entropy';
  pattern?: RegExp;
};
export type ScanResult = {
  version: 1;
  scannedFiles: number;
  skippedFiles: number;
  findings: Finding[];
  errors: string[];
};
export type EnvGuardConfig = {
  scan?: { paths?: string[]; maxFileSize?: number };
  ignore?: string[];
  rules?: { disabled?: string[]; entropy?: { enabled?: boolean; threshold?: number } };
  output?: { maskSecrets?: boolean };
};
