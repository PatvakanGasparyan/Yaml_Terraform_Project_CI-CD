# Cursor AI Implementation Prompt — IaC Platform Python Backend

Copy this entire document into Cursor as a **Project Rule** or paste into Agent chat when continuing the Node.js → Python migration.

---

## Mission

Complete the Python/FastAPI backend at `python-backend/` by porting all functionality from the NestJS backend at `apps/backend/src/`. The Next.js frontend at `apps/frontend/` must work without changes (same API contract at `/api/v1`).

**Source repository:** https://github.com/PatvakanGasparyan/Yaml_Terraform_Project_CI-CD

---

## Architecture Rules

1. **Layered design:** `api/` (routers) → `services/` (business logic) → `models/` (SQLAlchemy) + `schemas/` (Pydantic).
2. **No dead code:** Remove stub handlers as each module is implemented. Do not duplicate validation logic — use `OfflineValidationService` and `OpenAIService`.
3. **OpenAI only:** All AI via `app/services/openai_service.py`. No other AI providers.
4. **Structured logging:** Use `get_logger(__name__)` from `app/core/logging.py` with event names (e.g. `user_login`, `validation_failed`).
5. **Config:** All secrets and URLs via `app/core/config.py` (pydantic-settings). Never hardcode.
6. **Auth:** JWT bearer on protected routes via `Depends(get_current_user)`. Optional auth via `get_optional_user`.
7. **Errors:** Raise `HTTPException` with appropriate status codes. Wrap external API failures with clear messages.
8. **Database:** PostgreSQL preferred. Support MySQL via `DATABASE_URL` dialect. Use Alembic for all schema changes.

---

## Implementation Order (Priority)

### Phase 1 — Foundation (partially done)
- [x] FastAPI app, CORS, Swagger at `/docs`
- [x] Config, logging, security, DB session
- [x] User + Settings models
- [x] Auth: register, login, /me
- [x] Health check
- [x] Offline validation + AI validation hook
- [ ] Port all 27 SQLAlchemy models from `apps/backend/src/entities/`
- [ ] Alembic migration matching `init.sql`, `002_*.sql`, `003_*.sql`
- [ ] Redis client in `app/services/redis_service.py`

### Phase 2 — Core IaC Features
Port from NestJS modules:
- [ ] `validation` — fix, history persistence (`validation_history`, `fix_history`)
- [ ] `yaml` — schema validation, K8s explorer (`yaml.service.ts`)
- [ ] `terraform` — validate, format, dependency graph, modules, cost, plan, state, drift
- [ ] `conversion` — YAML↔JSON↔XML↔TOML↔INI↔CSV
- [ ] `ai` — explain, optimize, security audit, hover, translate, chat, docs, explain-error

Reference: `apps/backend/src/modules/{module}/{module}.service.ts`

### Phase 3 — GitHub & Workflow
- [ ] `github` — repos, branches, compare, workflows, commits, PR review, conflicts, issues
- [ ] `workflow` — validate → fix → commit pipeline
- [ ] `favorites`, `templates`, `recent-files`, `versions`

### Phase 4 — Enterprise
- [ ] `audit` — searchable audit log + CSV export
- [ ] `notifications` + `external-notifications` (SMTP, Slack, Telegram)
- [ ] `teams` — RBAC (owner/admin/editor/viewer)
- [ ] `scheduler` — APScheduler cron jobs for validation
- [ ] `diagrams` — Mermaid generation via OpenAI
- [ ] `activity` — WebSocket feed (`python-socketio` or FastAPI WebSockets)

### Phase 5 — Supporting
- [ ] `projects`, `files`, `storage` (local + S3), `backup`, `export`
- [ ] `compliance`, `chat`, `history`, `analytics`, `settings`, `users`

---

## Per-Module Porting Checklist

For each NestJS module:

1. Read `*.controller.ts` — list all HTTP methods and paths.
2. Read `*.service.ts` — port business logic to `app/services/{name}_service.py`.
3. Read `dto/*.ts` — convert to Pydantic models in `app/schemas/`.
4. Create `app/api/v1/{name}.py` router; remove stub from `stubs.py`.
5. Add tests in `tests/test_{name}.py`.
6. Register router in `app/api/v1/router.py`.

**API path parity example:**

| NestJS | FastAPI |
|--------|---------|
| `POST /terraform/drift` | `@router.post("/drift")` on prefix `/terraform` |
| `GET /github/repositories` | `@router.get("/repositories")` on prefix `/github` |

---

## OpenAI Service Methods to Port

From `apps/backend/src/services/openai/openai.service.ts`:

- `validate`, `fix`, `explain`, `optimize`, `securityAudit`
- `hoverExplain`, `translate`, `chat`, `generate`
- `rootCauseAnalysis`, `costAnalysis`, `generateDocumentation`
- `generateCommitMessage`, `explainError`, `planReview`
- `reviewPullRequest`, `resolveMergeConflicts`
- `generateInfrastructureDiagram`, `generateIssueFromError`

Track token usage in `api_usage` table (port `ApiUsage` entity).

---

## Pydantic Schemas

Port all interfaces from `packages/shared/src/types.ts` to `app/schemas/`:

- `ValidationIssue`, `ValidationResult`, `FixResult`
- `SecurityAuditResult`, `TerraformPlanView`, `DriftReport`
- `PrReviewResult`, `BranchCompareResult`, `GitHubWorkflowRun`
- `TeamMemberInfo`, `ScheduledJobInfo`, `InfrastructureDiagramResult`
- etc.

---

## Database Models to Create

Port all entities from `apps/backend/src/entities/`:

```
User, Project, File, FileVersion, ValidationHistory, FixHistory,
Translation, GithubAction, AuditLog, Settings, ApiUsage, ChatHistory,
Backup, Comment, Notification, FavoriteRepository, FixTemplate,
CommitMessage, RecentFile, VersionSnapshot, TerraformPlan,
TerraformPlanApproval, TeamMember, ScheduledJob, TerraformStateSnapshot,
PrReview, InfrastructureDiagram
```

Use UUID string primary keys (36 chars) to match existing MySQL data if migrating in place.

---

## External Integrations

| Integration | Python library | Env vars |
|-------------|----------------|----------|
| OpenAI | `openai` | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| Redis | `redis` | `REDIS_URL` |
| S3 | `boto3` | `S3_*` |
| Email | `aiosmtplib` | `SMTP_*` |
| Slack | `httpx` POST webhook | `SLACK_WEBHOOK_URL` |
| Telegram | `httpx` Bot API | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| GitHub | `httpx` REST API | User's `github_token` in DB |

---

## WebSocket Activity Feed

NestJS uses Socket.IO namespace `/activity`. Options:

1. **python-socketio** with ASGI mount — best compatibility with existing `socket.io-client` in frontend.
2. Native FastAPI WebSockets — requires frontend client change.

Prefer option 1 for zero frontend changes.

---

## Scheduler

Replace `@nestjs/schedule` with **APScheduler**:

- `BackgroundScheduler` started in `lifespan` in `main.py`
- `SchedulerService` reads `scheduled_jobs` table, runs `OfflineValidationService.validate()`
- On failure: create in-app notification + external notification

---

## Testing Requirements

- Unit tests for `OfflineValidationService`, `AuthService`, `OpenAIService` (mocked)
- Integration tests with `TestClient` for each router
- Use pytest fixtures for DB session (SQLite in-memory for tests)
- Target: ≥70% coverage on `app/services/`

```bash
pytest -v --cov=app --cov-report=term-missing
```

---

## Docker Compose (Python variant)

Add service to `docker-compose.yml`:

```yaml
python-backend:
  build:
    context: ./python-backend
    dockerfile: Dockerfile
  ports:
    - "4000:4000"
  environment:
    DATABASE_URL: postgresql+psycopg2://iac_user:iac_password@postgres:5432/iac_platform
    REDIS_URL: redis://redis:6379/0
  depends_on:
    - postgres
    - redis
```

Add PostgreSQL service or keep MySQL with `mysql+pymysql://` URL.

---

## Code Style

- Python 3.12+
- Type hints on all public functions
- `ruff` or `black` for formatting (optional)
- Docstrings only for non-obvious business logic
- Match NestJS API response shapes exactly for frontend compatibility

---

## Files NOT to Port

- `node_modules/`, `venv/`, NestJS decorators, TypeORM-specific code
- Unused OAuth routes (deps installed but not wired in NestJS auth controller)
- `run-migrations.ts` (missing in Node project — use Alembic instead)

---

## Verification Checklist

Before marking migration complete:

- [ ] All 32 API route groups respond (not stubs)
- [ ] Frontend login, editor validate/fix, GitHub, terraform plan work end-to-end
- [ ] Swagger docs complete at `/docs`
- [ ] Alembic migrations apply cleanly on fresh DB
- [ ] `pytest` passes
- [ ] Docker build succeeds
- [ ] `.env.example` documents all variables
- [ ] README updated with deployment instructions

---

## Example: Porting Terraform Drift

**NestJS** (`terraform.service.ts`):
```typescript
detectDrift(stateContent: string, codeContent: string): DriftReport
```

**Python** (`app/services/terraform_service.py`):
```python
def detect_drift(self, state_content: str, code_content: str) -> DriftReport:
    ...
```

**Router** (`app/api/v1/terraform.py`):
```python
@router.post("/drift", response_model=DriftReport)
def drift(dto: DriftRequest) -> DriftReport:
    return terraform_service.detect_drift(dto.state_content, dto.code_content)
```

---

## Agent Instructions

When implementing a module:

1. Search NestJS source: `apps/backend/src/modules/{module}/`
2. Implement Python service first (pure logic, testable)
3. Add Pydantic schemas
4. Wire router with correct prefix and auth
5. Remove stub from `stubs.py`
6. Add pytest tests
7. Run `pytest` and fix failures before moving to next module

**Do not** change the Next.js frontend unless an API contract bug is found — fix the Python backend to match NestJS behavior instead.
