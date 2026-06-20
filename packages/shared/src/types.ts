export type SupportedLanguage = 'en' | 'ru' | 'hy';

export type FileFormat =
  | 'yaml'
  | 'terraform'
  | 'tfvars'
  | 'json'
  | 'xml'
  | 'toml'
  | 'ini'
  | 'docker-compose'
  | 'kubernetes'
  | 'helm'
  | 'ansible'
  | 'cloudformation'
  | 'openapi'
  | 'github-actions'
  | 'gitlab-ci'
  | 'jenkins'
  | 'crd'
  | 'hcl'
  | 'properties'
  | 'env'
  | 'csv'
  | 'markdown'
  | 'unknown';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type ExplainLevel = 'beginner' | 'intermediate' | 'expert' | 'detailed';

export type AIProvider = 'openai';

export type Theme = 'light' | 'dark' | 'system';

export type StorageType = 'local' | 's3';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'local' | 'google' | 'github';
  createdAt: string;
  updatedAt: string;
}

export interface ValidationIssue {
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  severity: Severity;
  message: string;
  rule?: string;
  suggestion?: string;
  category?: string;
}

export interface ValidationResult {
  valid: boolean;
  format: FileFormat;
  issues: ValidationIssue[];
  score?: number;
  durationMs: number;
}

export interface FixResult {
  original: string;
  fixed: string;
  diff: string;
  changes: number;
  issues: ValidationIssue[];
}

export interface ExplainResult {
  level: ExplainLevel;
  content: string;
  sections?: Record<string, string>;
}

export interface SecurityFinding {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  line?: number;
  column?: number;
  remediation?: string;
  category: string;
  compliance?: string[];
}

export interface SecurityAuditResult {
  findings: SecurityFinding[];
  score: number;
  summary: string;
}

export interface OptimizationSuggestion {
  category: 'performance' | 'security' | 'maintainability' | 'cost';
  title: string;
  description: string;
  impact: Severity;
  before?: string;
  after?: string;
}

export interface HoverExplainResult {
  line: number;
  whatItDoes: string;
  whyItExists: string;
  documentation: DocLink[];
  securityImplications: string;
  bestPractices: string[];
  potentialErrors: string[];
  suggestedImprovements: string[];
}

export interface DocLink {
  title: string;
  url: string;
  type: 'official' | 'tutorial' | 'best-practice' | 'example';
}

export interface ConversionResult {
  sourceFormat: FileFormat;
  targetFormat: FileFormat;
  content: string;
  valid: boolean;
  issues: ValidationIssue[];
}

export interface RiskScores {
  security: number;
  reliability: number;
  cost: number;
  maintainability: number;
  overall: number;
}

export interface TerraformResource {
  type: string;
  name: string;
  line: number;
  dependencies: string[];
}

export interface DependencyGraph {
  nodes: Array<{ id: string; label: string; type: string }>;
  edges: Array<{ from: string; to: string; type: string }>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface AnalyticsSummary {
  totalValidations: number;
  totalFixes: number;
  totalUploads: number;
  totalTranslations: number;
  totalAiRequests: number;
  commonErrors: Array<{ error: string; count: number }>;
  formatUsage: Array<{ format: string; count: number }>;
  activityChart: Array<{ date: string; count: number }>;
}

export interface HistoryEntry {
  id: string;
  type: 'validation' | 'fix' | 'translation' | 'upload' | 'download' | 'github_push' | 'ai_request';
  fileName?: string;
  format?: FileFormat;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface UserSettings {
  theme: Theme;
  language: SupportedLanguage;
  editorFontSize: number;
  editorTheme: string;
  autoSave: boolean;
  autoFixOnUpload: boolean;
  autoTranslate: boolean;
  aiProvider: AIProvider;
  aiModel: string;
  githubConnected: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  resourceType?: string;
  resourceName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId?: string;
  action: string;
  module?: string;
  resourceType?: string;
  resourceId?: string;
  status: string;
  beforeValue?: string;
  afterValue?: string;
  durationMs: number;
  ipAddress?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface BranchCompareResult {
  files: Array<{
    filename: string;
    status: 'added' | 'removed' | 'modified' | 'renamed';
    additions: number;
    deletions: number;
    patch?: string;
  }>;
  totalAdditions: number;
  totalDeletions: number;
  commits: Array<{ sha: string; message: string; author: string; date: string }>;
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  branch: string;
  event: string;
  actor: string;
  durationSeconds?: number;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface TerraformPlanView {
  id?: string;
  creates: Array<{ address: string; type: string; risk: string }>;
  updates: Array<{ address: string; type: string; risk: string; changes?: string[] }>;
  deletes: Array<{ address: string; type: string; risk: string }>;
  riskScore: number;
  costImpact?: string;
  dependencies: string[];
  aiAnalysis?: string;
  status?: string;
}

export interface ErrorExplanation {
  whatHappened: string;
  whyItHappened: string;
  howToFix: string;
  exampleFix?: string;
  bestPractices: string[];
  documentation: DocLink[];
}

export interface CommitMessagePreview {
  id: string;
  message: string;
  type: string;
  scope?: string;
  body?: string;
}

export interface VersionSnapshotInfo {
  id: string;
  version: number;
  fileName?: string;
  format?: string;
  action: string;
  label?: string;
  createdAt: string;
}

export interface FixTemplateInfo {
  id: string;
  name: string;
  category: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteRepoInfo {
  id: string;
  repository: string;
  defaultBranch?: string;
  pinned: boolean;
  createdAt: string;
}

export interface RecentFileInfo {
  id: string;
  fileId?: string;
  fileName: string;
  format: string;
  projectId?: string;
  lastAction?: string;
  openedAt: string;
}

export interface WorkflowResult {
  success: boolean;
  steps: Array<{ step: string; status: 'success' | 'failed' | 'skipped'; message?: string }>;
  commitSha?: string;
  backupId?: string;
  validationScore?: number;
}

export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface TeamMemberInfo {
  id: string;
  projectId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  role: TeamRole;
  createdAt: string;
}

export interface ScheduledJobInfo {
  id: string;
  name: string;
  cronExpression: string;
  fileName?: string;
  format: string;
  enabled: boolean;
  lastRunAt?: string;
  lastStatus?: string;
  createdAt: string;
}

export interface TerraformStateView {
  id?: string;
  name?: string;
  resources: Array<{ type: string; name: string; provider?: string; module?: string }>;
  outputs: Array<{ name: string; value?: unknown }>;
  resourceCount: number;
  createdAt?: string;
}

export interface DriftReport {
  hasDrift: boolean;
  drift: Array<{ resource: string; status: 'missing_in_code' | 'missing_in_state' | 'modified'; details?: string }>;
  summary: { added: number; removed: number; modified: number };
}

export interface K8sResourceNode {
  id: string;
  kind: string;
  name: string;
  namespace?: string;
  apiVersion?: string;
  children?: K8sResourceNode[];
  labels?: Record<string, string>;
}

export interface PrReviewResult {
  id: string;
  repository: string;
  prNumber: number;
  analysis: string;
  riskScore: number;
  recommendation: 'approve' | 'request_changes' | 'comment';
  findings: Array<{ severity: string; title: string; description: string }>;
  createdAt: string;
}

export interface MergeConflictResolution {
  conflicts: Array<{ file: string; resolution: string; explanation: string }>;
  mergedContent?: string;
}

export interface InfrastructureDiagramResult {
  id: string;
  mermaid: string;
  resourceCount: number;
  format: string;
}

export interface GitHubIssueResult {
  issueNumber: number;
  issueUrl: string;
  title: string;
}
