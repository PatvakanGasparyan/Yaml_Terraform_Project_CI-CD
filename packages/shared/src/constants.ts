import type { FileFormat } from './types';

export const SUPPORTED_LANGUAGES = ['en', 'ru', 'hy'] as const;

export const AI_PROVIDERS = ['openai'] as const;

export const OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4.1',
  'gpt-4.1-mini',
  'o1',
  'o1-mini',
] as const;

export const FILE_EXTENSIONS: Record<string, FileFormat> = {
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.tf': 'terraform',
  '.tfvars': 'tfvars',
  '.json': 'json',
  '.xml': 'xml',
  '.toml': 'toml',
  '.ini': 'ini',
  '.hcl': 'hcl',
  '.properties': 'properties',
  '.env': 'env',
  '.csv': 'csv',
  '.md': 'markdown',
  '.markdown': 'markdown',
};

export const COMPLIANCE_FRAMEWORKS = [
  'CIS',
  'NIST',
  'SOC2',
  'ISO27001',
] as const;

export const SECRET_PATTERNS = [
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g, severity: 'critical' as const },
  { name: 'AWS Secret Key', pattern: /[A-Za-z0-9/+=]{40}/g, severity: 'critical' as const },
  { name: 'GitHub Token', pattern: /ghp_[A-Za-z0-9]{36}/g, severity: 'critical' as const },
  { name: 'GitHub OAuth', pattern: /gho_[A-Za-z0-9]{36}/g, severity: 'critical' as const },
  { name: 'Private Key', pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g, severity: 'critical' as const },
  { name: 'Generic API Key', pattern: /api[_-]?key\s*[:=]\s*['"]?[A-Za-z0-9_-]{16,}/gi, severity: 'high' as const },
  { name: 'Password in Config', pattern: /password\s*[:=]\s*['"][^'"]+['"]/gi, severity: 'high' as const },
  { name: 'Azure Secret', pattern: /[A-Za-z0-9+/]{86}==/g, severity: 'critical' as const },
  { name: 'GCP Service Account', pattern: /"type"\s*:\s*"service_account"/g, severity: 'high' as const },
];

export const DEFAULT_USER_SETTINGS = {
  theme: 'system' as const,
  language: 'en' as const,
  editorFontSize: 14,
  editorTheme: 'vs-dark',
  autoSave: true,
  autoFixOnUpload: false,
  autoTranslate: false,
  aiProvider: 'openai' as const,
  aiModel: 'gpt-4o',
  githubConnected: false,
};
