-- IaC Platform Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS iac_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE iac_platform;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(512) NULL,
  provider ENUM('local', 'google', 'github') NOT NULL DEFAULT 'local',
  provider_id VARCHAR(255) NULL,
  github_token TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_provider (provider, provider_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  is_team BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_projects_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS files (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NULL,
  name VARCHAR(512) NOT NULL,
  path VARCHAR(1024) NULL,
  format VARCHAR(50) NOT NULL DEFAULT 'unknown',
  content LONGTEXT NOT NULL,
  size_bytes INT NOT NULL DEFAULT 0,
  storage_path VARCHAR(1024) NULL,
  version INT NOT NULL DEFAULT 1,
  checksum VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  INDEX idx_files_user (user_id),
  INDEX idx_files_project (project_id),
  INDEX idx_files_format (format)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS file_versions (
  id VARCHAR(36) PRIMARY KEY,
  file_id VARCHAR(36) NOT NULL,
  version INT NOT NULL,
  content LONGTEXT NOT NULL,
  checksum VARCHAR(64) NULL,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_file_version (file_id, version)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS validation_history (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  file_id VARCHAR(36) NULL,
  file_name VARCHAR(512) NULL,
  format VARCHAR(50) NOT NULL,
  is_valid BOOLEAN NOT NULL,
  issues_count INT NOT NULL DEFAULT 0,
  issues_json JSON NULL,
  score DECIMAL(5,2) NULL,
  duration_ms INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL,
  INDEX idx_validation_user (user_id),
  INDEX idx_validation_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fix_history (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  file_id VARCHAR(36) NULL,
  file_name VARCHAR(512) NULL,
  format VARCHAR(50) NOT NULL,
  original_content LONGTEXT NOT NULL,
  fixed_content LONGTEXT NOT NULL,
  diff_content LONGTEXT NULL,
  changes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL,
  INDEX idx_fix_user (user_id),
  INDEX idx_fix_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS translations (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  source_language VARCHAR(10) NOT NULL,
  target_language VARCHAR(10) NOT NULL,
  source_text LONGTEXT NOT NULL,
  translated_text LONGTEXT NOT NULL,
  context VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_translations_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS github_actions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  file_id VARCHAR(36) NULL,
  action_type ENUM('commit', 'branch', 'pull_request', 'push') NOT NULL,
  repository VARCHAR(512) NOT NULL,
  branch VARCHAR(255) NULL,
  commit_sha VARCHAR(64) NULL,
  pr_number INT NULL,
  pr_url VARCHAR(1024) NULL,
  status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL,
  INDEX idx_github_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NULL,
  resource_id VARCHAR(36) NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS settings (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  theme VARCHAR(20) NOT NULL DEFAULT 'system',
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  editor_font_size INT NOT NULL DEFAULT 14,
  editor_theme VARCHAR(50) NOT NULL DEFAULT 'vs-dark',
  auto_save BOOLEAN NOT NULL DEFAULT TRUE,
  auto_fix_on_upload BOOLEAN NOT NULL DEFAULT FALSE,
  auto_translate BOOLEAN NOT NULL DEFAULT FALSE,
  ai_provider VARCHAR(50) NOT NULL DEFAULT 'openai',
  ai_model VARCHAR(100) NOT NULL DEFAULT 'gpt-4o',
  github_connected BOOLEAN NOT NULL DEFAULT FALSE,
  preferences_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS api_usage (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  operation VARCHAR(100) NOT NULL,
  tokens_input INT NOT NULL DEFAULT 0,
  tokens_output INT NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10,6) NULL,
  duration_ms INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_api_usage_user (user_id),
  INDEX idx_api_usage_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chat_history (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  file_id VARCHAR(36) NULL,
  session_id VARCHAR(36) NOT NULL,
  role ENUM('user', 'assistant', 'system') NOT NULL,
  content LONGTEXT NOT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL,
  INDEX idx_chat_user (user_id),
  INDEX idx_chat_session (session_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS backups (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  file_id VARCHAR(36) NOT NULL,
  version INT NOT NULL,
  content LONGTEXT NOT NULL,
  label VARCHAR(255) NULL,
  is_auto BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  INDEX idx_backups_file (file_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS team_members (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role ENUM('owner', 'admin', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_team_member (project_id, user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR(36) PRIMARY KEY,
  file_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  line_number INT NULL,
  content TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_comments_file (file_id)
) ENGINE=InnoDB;
