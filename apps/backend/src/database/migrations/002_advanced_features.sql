-- Advanced features migration (MySQL 8 compatible)

-- Extend audit_logs (run once; ignore errors if columns exist)
ALTER TABLE audit_logs ADD COLUMN module VARCHAR(100) NULL;
ALTER TABLE audit_logs ADD COLUMN status ENUM('success','failed','pending') DEFAULT 'success';
ALTER TABLE audit_logs ADD COLUMN before_value LONGTEXT NULL;
ALTER TABLE audit_logs ADD COLUMN after_value LONGTEXT NULL;
ALTER TABLE audit_logs ADD COLUMN duration_ms INT DEFAULT 0;

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  metadata JSON NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_read (is_read)
);

CREATE TABLE IF NOT EXISTS favorite_repositories (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  repository VARCHAR(255) NOT NULL,
  default_branch VARCHAR(100) NULL,
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_repo (user_id, repository)
);

CREATE TABLE IF NOT EXISTS fix_templates (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category ENUM('fix','validation','conversion','terraform','security') NOT NULL,
  settings JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS commit_messages (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  repository VARCHAR(255) NULL,
  file_name VARCHAR(255) NULL,
  diff LONGTEXT NOT NULL,
  message TEXT NOT NULL,
  was_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recent_files (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  file_id VARCHAR(36) NULL,
  file_name VARCHAR(255) NOT NULL,
  format VARCHAR(50) NOT NULL,
  project_id VARCHAR(36) NULL,
  last_action VARCHAR(100) NULL,
  opened_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_recent_user (user_id)
);

CREATE TABLE IF NOT EXISTS version_snapshots (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  file_id VARCHAR(36) NULL,
  file_name VARCHAR(255) NULL,
  format VARCHAR(50) NULL,
  version INT NOT NULL,
  content LONGTEXT NOT NULL,
  before_content LONGTEXT NULL,
  action VARCHAR(100) NOT NULL,
  label VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_snapshots_user (user_id),
  INDEX idx_snapshots_file (file_id)
);

CREATE TABLE IF NOT EXISTS terraform_plans (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  plan_json LONGTEXT NOT NULL,
  risk_score DECIMAL(5,2) DEFAULT 0,
  ai_analysis LONGTEXT NULL,
  status ENUM('pending','approved','rejected','applied') DEFAULT 'pending',
  create_count INT DEFAULT 0,
  update_count INT DEFAULT 0,
  delete_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS terraform_plan_approvals (
  id VARCHAR(36) PRIMARY KEY,
  plan_id VARCHAR(36) NOT NULL,
  approver_id VARCHAR(36) NOT NULL,
  decision ENUM('approved','rejected') NOT NULL,
  reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES terraform_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE CASCADE
);
