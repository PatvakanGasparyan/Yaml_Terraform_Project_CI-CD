import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { File } from './file.entity';

export { User } from './user.entity';
export { File } from './file.entity';
export { Project } from './project.entity';

@Entity('validation_history')
export class ValidationHistory {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'file_id', nullable: true })
  fileId?: string;

  @Column({ name: 'file_name', nullable: true })
  fileName?: string;

  @Column()
  format!: string;

  @Column({ name: 'is_valid' })
  isValid!: boolean;

  @Column({ name: 'issues_count', default: 0 })
  issuesCount!: number;

  @Column({ name: 'issues_json', type: 'json', nullable: true })
  issuesJson?: unknown;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score?: number;

  @Column({ name: 'duration_ms', default: 0 })
  durationMs!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => File, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'file_id' })
  file?: File;
}

@Entity('fix_history')
export class FixHistory {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'file_id', nullable: true })
  fileId?: string;

  @Column({ name: 'file_name', nullable: true })
  fileName?: string;

  @Column()
  format!: string;

  @Column({ name: 'original_content', type: 'longtext' })
  originalContent!: string;

  @Column({ name: 'fixed_content', type: 'longtext' })
  fixedContent!: string;

  @Column({ name: 'diff_content', type: 'longtext', nullable: true })
  diffContent?: string;

  @Column({ name: 'changes_count', default: 0 })
  changesCount!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

@Entity('translations')
export class Translation {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'source_language' })
  sourceLanguage!: string;

  @Column({ name: 'target_language' })
  targetLanguage!: string;

  @Column({ name: 'source_text', type: 'longtext' })
  sourceText!: string;

  @Column({ name: 'translated_text', type: 'longtext' })
  translatedText!: string;

  @Column({ nullable: true })
  context?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

@Entity('github_actions')
export class GithubAction {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'file_id', nullable: true })
  fileId?: string;

  @Column({ name: 'action_type', type: 'enum', enum: ['commit', 'branch', 'pull_request', 'push'] })
  actionType!: 'commit' | 'branch' | 'pull_request' | 'push';

  @Column()
  repository!: string;

  @Column({ nullable: true })
  branch?: string;

  @Column({ name: 'commit_sha', nullable: true })
  commitSha?: string;

  @Column({ name: 'pr_number', nullable: true })
  prNumber?: number;

  @Column({ name: 'pr_url', nullable: true })
  prUrl?: string;

  @Column({ type: 'enum', enum: ['pending', 'success', 'failed'], default: 'pending' })
  status!: 'pending' | 'success' | 'failed';

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column()
  action!: string;

  @Column({ name: 'resource_type', nullable: true })
  resourceType?: string;

  @Column({ name: 'resource_id', nullable: true })
  resourceId?: string;

  @Column({ type: 'json', nullable: true })
  details?: Record<string, unknown>;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @Column({ nullable: true })
  module?: string;

  @Column({ type: 'enum', enum: ['success', 'failed', 'pending'], default: 'success' })
  status!: 'success' | 'failed' | 'pending';

  @Column({ name: 'before_value', type: 'longtext', nullable: true })
  beforeValue?: string;

  @Column({ name: 'after_value', type: 'longtext', nullable: true })
  afterValue?: string;

  @Column({ name: 'duration_ms', default: 0 })
  durationMs!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity('settings')
export class Settings {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id', unique: true })
  userId!: string;

  @Column({ default: 'system' })
  theme!: string;

  @Column({ default: 'en' })
  language!: string;

  @Column({ name: 'editor_font_size', default: 14 })
  editorFontSize!: number;

  @Column({ name: 'editor_theme', default: 'vs-dark' })
  editorTheme!: string;

  @Column({ name: 'auto_save', default: true })
  autoSave!: boolean;

  @Column({ name: 'auto_fix_on_upload', default: false })
  autoFixOnUpload!: boolean;

  @Column({ name: 'auto_translate', default: false })
  autoTranslate!: boolean;

  @Column({ name: 'ai_provider', default: 'openai' })
  aiProvider!: string;

  @Column({ name: 'ai_model', default: 'gpt-4o' })
  aiModel!: string;

  @Column({ name: 'github_connected', default: false })
  githubConnected!: boolean;

  @Column({ name: 'preferences_json', type: 'json', nullable: true })
  preferencesJson?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

@Entity('api_usage')
export class ApiUsage {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column()
  provider!: string;

  @Column()
  model!: string;

  @Column()
  operation!: string;

  @Column({ name: 'tokens_input', default: 0 })
  tokensInput!: number;

  @Column({ name: 'tokens_output', default: 0 })
  tokensOutput!: number;

  @Column({ name: 'cost_usd', type: 'decimal', precision: 10, scale: 6, nullable: true })
  costUsd?: number;

  @Column({ name: 'duration_ms', default: 0 })
  durationMs!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

@Entity('chat_history')
export class ChatHistory {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'file_id', nullable: true })
  fileId?: string;

  @Column({ name: 'session_id' })
  sessionId!: string;

  @Column({ type: 'enum', enum: ['user', 'assistant', 'system'] })
  role!: 'user' | 'assistant' | 'system';

  @Column({ type: 'longtext' })
  content!: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

@Entity('backups')
export class Backup {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'file_id' })
  fileId!: string;

  @Column()
  version!: number;

  @Column({ type: 'longtext' })
  content!: string;

  @Column({ nullable: true })
  label?: string;

  @Column({ name: 'is_auto', default: true })
  isAuto!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity('file_versions')
export class FileVersion {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'file_id' })
  fileId!: string;

  @Column()
  version!: number;

  @Column({ type: 'longtext' })
  content!: string;

  @Column({ nullable: true })
  checksum?: string;

  @Column({ name: 'created_by' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity('comments')
export class Comment {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'file_id' })
  fileId!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'line_number', nullable: true })
  lineNumber?: number;

  @Column({ type: 'text' })
  content!: string;

  @Column({ default: false })
  resolved!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('notifications')
export class Notification {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column()
  type!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'is_read', default: false })
  isRead!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity('favorite_repositories')
export class FavoriteRepository {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column()
  repository!: string;

  @Column({ name: 'default_branch', nullable: true })
  defaultBranch?: string;

  @Column({ default: false })
  pinned!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity('fix_templates')
export class FixTemplate {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: ['fix', 'validation', 'conversion', 'terraform', 'security'] })
  category!: 'fix' | 'validation' | 'conversion' | 'terraform' | 'security';

  @Column({ type: 'json' })
  settings!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('commit_messages')
export class CommitMessage {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ nullable: true })
  repository?: string;

  @Column({ name: 'file_name', nullable: true })
  fileName?: string;

  @Column({ type: 'longtext' })
  diff!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ name: 'was_used', default: false })
  wasUsed!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity('recent_files')
export class RecentFile {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'file_id', nullable: true })
  fileId?: string;

  @Column({ name: 'file_name' })
  fileName!: string;

  @Column()
  format!: string;

  @Column({ name: 'project_id', nullable: true })
  projectId?: string;

  @Column({ name: 'last_action', nullable: true })
  lastAction?: string;

  @Column({ name: 'opened_at', type: 'datetime' })
  openedAt!: Date;
}

@Entity('version_snapshots')
export class VersionSnapshot {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'file_id', nullable: true })
  fileId?: string;

  @Column({ name: 'file_name', nullable: true })
  fileName?: string;

  @Column({ nullable: true })
  format?: string;

  @Column()
  version!: number;

  @Column({ type: 'longtext' })
  content!: string;

  @Column({ name: 'before_content', type: 'longtext', nullable: true })
  beforeContent?: string;

  @Column()
  action!: string;

  @Column({ nullable: true })
  label?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity('terraform_plans')
export class TerraformPlan {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'plan_json', type: 'longtext' })
  planJson!: string;

  @Column({ name: 'risk_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  riskScore!: number;

  @Column({ name: 'ai_analysis', type: 'longtext', nullable: true })
  aiAnalysis?: string;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected', 'applied'], default: 'pending' })
  status!: 'pending' | 'approved' | 'rejected' | 'applied';

  @Column({ name: 'create_count', default: 0 })
  createCount!: number;

  @Column({ name: 'update_count', default: 0 })
  updateCount!: number;

  @Column({ name: 'delete_count', default: 0 })
  deleteCount!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity('terraform_plan_approvals')
export class TerraformPlanApproval {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'plan_id' })
  planId!: string;

  @Column({ name: 'approver_id' })
  approverId!: string;

  @Column({ type: 'enum', enum: ['approved', 'rejected'] })
  decision!: 'approved' | 'rejected';

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity('team_members')
export class TeamMember {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'project_id' })
  projectId!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ type: 'enum', enum: ['owner', 'admin', 'editor', 'viewer'], default: 'viewer' })
  role!: 'owner' | 'admin' | 'editor' | 'viewer';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity('scheduled_jobs')
export class ScheduledJob {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column()
  name!: string;

  @Column({ name: 'cron_expression' })
  cronExpression!: string;

  @Column({ name: 'file_name', nullable: true })
  fileName?: string;

  @Column({ type: 'longtext', nullable: true })
  content?: string;

  @Column({ default: 'yaml' })
  format!: string;

  @Column({ default: true })
  enabled!: boolean;

  @Column({ name: 'last_run_at', type: 'datetime', nullable: true })
  lastRunAt?: Date;

  @Column({ name: 'last_status', nullable: true })
  lastStatus?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity('terraform_state_snapshots')
export class TerraformStateSnapshot {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column()
  name!: string;

  @Column({ name: 'state_json', type: 'longtext' })
  stateJson!: string;

  @Column({ name: 'resource_count', default: 0 })
  resourceCount!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity('pr_reviews')
export class PrReview {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column()
  repository!: string;

  @Column({ name: 'pr_number' })
  prNumber!: number;

  @Column({ type: 'longtext' })
  analysis!: string;

  @Column({ name: 'risk_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  riskScore!: number;

  @Column({ type: 'enum', enum: ['approve', 'request_changes', 'comment'], default: 'comment' })
  recommendation!: 'approve' | 'request_changes' | 'comment';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

@Entity('infrastructure_diagrams')
export class InfrastructureDiagram {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column()
  format!: string;

  @Column({ name: 'diagram_mermaid', type: 'longtext' })
  diagramMermaid!: string;

  @Column({ name: 'resource_count', default: 0 })
  resourceCount!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
