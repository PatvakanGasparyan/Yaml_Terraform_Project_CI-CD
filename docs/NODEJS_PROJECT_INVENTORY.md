# Node.js Project Inventory (Migration Reference)

## GitHub Repository

**URL:** https://github.com/PatvakanGasparyan/Yaml_Terraform_Project_CI-CD

## Monorepo Layout

```
iac-platform/
├── package.json                 # npm workspaces root
├── docker-compose.yml           # MySQL, Redis, NestJS backend, Next.js frontend
├── .env.example
├── apps/
│   ├── backend/                 # NestJS 11 API (port 4000)
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── modules/         # 32 feature modules
│   │       ├── entities/        # 27 TypeORM entities
│   │       ├── database/migrations/
│   │       └── services/openai/
│   └── frontend/                # Next.js 15 (port 3000)
│       └── src/app/             # 25 page routes
├── packages/shared/             # TypeScript shared types
├── docker/
├── k8s/deployment.yaml
└── docs/
```

## Backend Modules → Python Router Mapping

| NestJS Module | Route Prefix | Python Router |
|---------------|--------------|---------------|
| auth | `/auth` | `app/api/v1/auth.py` |
| users | `/users` | `app/api/v1/users.py` |
| projects | `/projects` | `app/api/v1/projects.py` |
| files | `/files` | `app/api/v1/files.py` |
| validation | `/validation` | `app/api/v1/validation.py` |
| yaml | `/yaml` | `app/api/v1/yaml.py` |
| terraform | `/terraform` | `app/api/v1/terraform.py` |
| conversion | `/conversion` | `app/api/v1/conversion.py` |
| ai | `/ai` | `app/api/v1/ai.py` |
| github | `/github` | `app/api/v1/github.py` |
| compliance | `/compliance` | `app/api/v1/compliance.py` |
| chat | `/chat` | `app/api/v1/chat.py` |
| history | `/history` | `app/api/v1/history.py` |
| analytics | `/analytics` | `app/api/v1/analytics.py` |
| settings | `/settings` | `app/api/v1/settings.py` |
| backup | `/backup` | `app/api/v1/backup.py` |
| export | `/export` | `app/api/v1/export.py` |
| audit | `/audit` | `app/api/v1/audit.py` |
| notifications | `/notifications` | `app/api/v1/notifications.py` |
| external-notifications | `/notifications/external` | `app/api/v1/external_notifications.py` |
| activity | WebSocket `/activity` | `app/api/ws/activity.py` |
| versions | `/versions` | `app/api/v1/versions.py` |
| favorites | `/favorites` | `app/api/v1/favorites.py` |
| templates | `/templates` | `app/api/v1/templates.py` |
| recent-files | `/recent-files` | `app/api/v1/recent_files.py` |
| workflow | `/workflow` | `app/api/v1/workflow.py` |
| teams | `/teams` | `app/api/v1/teams.py` |
| scheduler | `/scheduler` | `app/api/v1/scheduler.py` |
| diagrams | `/diagrams` | `app/api/v1/diagrams.py` |
| health | `/health` | `app/api/v1/health.py` |

## Key Source Files

| File | Purpose |
|------|---------|
| `apps/backend/src/main.ts` | Bootstrap, CORS, Swagger, global prefix |
| `apps/backend/src/app.module.ts` | Module registration |
| `apps/backend/src/services/openai/openai.service.ts` | All AI operations |
| `apps/backend/src/modules/validation/offline-validation.service.ts` | Offline YAML/TF validation |
| `apps/backend/src/modules/auth/auth.service.ts` | JWT + bcrypt auth |
| `packages/shared/src/types.ts` | Shared API contracts |
| `apps/frontend/src/lib/api.ts` | Frontend HTTP client |

## Database (27 tables)

`users`, `projects`, `files`, `file_versions`, `validation_history`, `fix_history`, `translations`, `github_actions`, `audit_logs`, `settings`, `api_usage`, `chat_history`, `backups`, `comments`, `notifications`, `favorite_repositories`, `fix_templates`, `commit_messages`, `recent_files`, `version_snapshots`, `terraform_plans`, `terraform_plan_approvals`, `team_members`, `scheduled_jobs`, `terraform_state_snapshots`, `pr_reviews`, `infrastructure_diagrams`

SQL migrations: `init.sql`, `002_advanced_features.sql`, `003_enterprise_features.sql`

## Docker Ports

| Service | Port |
|---------|------|
| Frontend | 3000 |
| Backend | 4000 |
| MySQL | 3307 (host) |
| Redis | 6379 |

## Frontend (keep as-is)

Next.js frontend can remain unchanged; point `NEXT_PUBLIC_API_URL` to the Python backend.
