-- Enterprise features migration (003)

CREATE TABLE IF NOT EXISTS team_members (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role ENUM('owner','admin','editor','viewer') NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_team_member (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  cron_expression VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NULL,
  content LONGTEXT NULL,
  format VARCHAR(50) DEFAULT 'yaml',
  enabled BOOLEAN DEFAULT TRUE,
  last_run_at DATETIME NULL,
  last_status VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS terraform_state_snapshots (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  state_json LONGTEXT NOT NULL,
  resource_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pr_reviews (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  repository VARCHAR(255) NOT NULL,
  pr_number INT NOT NULL,
  analysis LONGTEXT NOT NULL,
  risk_score DECIMAL(5,2) DEFAULT 0,
  recommendation ENUM('approve','request_changes','comment') DEFAULT 'comment',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS infrastructure_diagrams (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  format VARCHAR(50) NOT NULL,
  diagram_mermaid LONGTEXT NOT NULL,
  resource_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
