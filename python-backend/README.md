# IaC Platform — Python Backend (FastAPI)

Python port of the NestJS backend for the **Enterprise AI-Powered YAML & Terraform Validation Platform**.

## Stack

| Layer | Technology |
|-------|------------|
| API | FastAPI + Uvicorn |
| Validation | Pydantic v2 |
| ORM | SQLAlchemy 2.x |
| Migrations | Alembic |
| Auth | JWT (python-jose) + bcrypt |
| AI | OpenAI SDK |
| Cache | Redis |
| Scheduler | APScheduler |
| Logging | structlog |
| Tests | pytest |

## Project Structure

```
python-backend/
├── app/
│   ├── main.py                 # FastAPI app factory
│   ├── core/
│   │   ├── config.py           # pydantic-settings
│   │   ├── security.py         # JWT + password hashing
│   │   ├── logging.py          # structlog setup
│   │   └── deps.py             # FastAPI dependencies
│   ├── api/v1/
│   │   ├── router.py           # Aggregates all routers
│   │   ├── auth.py             # ✅ Implemented
│   │   ├── health.py           # ✅ Implemented
│   │   ├── validation.py       # ✅ Implemented
│   │   └── stubs.py            # 🔲 26 modules to implement
│   ├── models/                 # SQLAlchemy models (User done)
│   ├── schemas/                # Pydantic request/response models
│   ├── services/               # Business logic
│   └── db/                     # Session + Base
├── alembic/                    # Database migrations
├── tests/
├── requirements.txt
├── .env.example
├── Dockerfile
└── CURSOR_AI_IMPLEMENTATION_PROMPT.md
```

## Quick Start

```bash
cd python-backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit DATABASE_URL and OPENAI_API_KEY

# PostgreSQL (recommended)
alembic revision --autogenerate -m "init"
alembic upgrade head

uvicorn app.main:app --reload --port 4000
```

- API: http://localhost:4000/api/v1  
- Swagger: http://localhost:4000/docs  

## Docker

```bash
docker build -t iac-python-backend .
docker run -p 4000:4000 --env-file .env iac-python-backend
```

## Frontend Compatibility

Keep the existing Next.js frontend. Set:

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

API routes use the same prefixes as the NestJS backend (`/api/v1/...`).

## Migration Status

| Module | Status |
|--------|--------|
| auth | ✅ Done |
| health | ✅ Done |
| validation (offline + AI) | ✅ Core done |
| openai service | ✅ Skeleton |
| 26 other modules | 🔲 Stubs — see Cursor prompt |
| 25 DB models | 🔲 User + Settings only |
| WebSocket activity | 🔲 Not started |
| Alembic migrations | 🔲 Run after adding models |

## Node.js Source Reference

- GitHub: https://github.com/PatvakanGasparyan/Yaml_Terraform_Project_CI-CD
- Inventory: `docs/NODEJS_PROJECT_INVENTORY.md`
- NestJS backend: `apps/backend/src/`
- Shared types: `packages/shared/src/types.ts`

## Tests

```bash
pytest -v
pytest --cov=app tests/
```
