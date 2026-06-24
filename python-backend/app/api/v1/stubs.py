"""Stub routers for remaining NestJS modules — implement per CURSOR_AI_IMPLEMENTATION_PROMPT.md."""

from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.models.user import User

# Each router mirrors the NestJS module API prefix.
# Replace `not_implemented` handlers with full service implementations.

def _stub_router(prefix: str, tag: str) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=[tag])

    @router.get("")
    def not_implemented(user: User = Depends(get_current_user)) -> dict:
        return {"status": "stub", "module": tag, "message": "Implement in app/services/"}

    return router


terraform_router = _stub_router("/terraform", "Terraform")
yaml_router = _stub_router("/yaml", "YAML")
github_router = _stub_router("/github", "GitHub")
ai_router = _stub_router("/ai", "AI")
projects_router = _stub_router("/projects", "Projects")
files_router = _stub_router("/files", "Files")
conversion_router = _stub_router("/conversion", "Conversion")
compliance_router = _stub_router("/compliance", "Compliance")
chat_router = _stub_router("/chat", "Chat")
history_router = _stub_router("/history", "History")
analytics_router = _stub_router("/analytics", "Analytics")
settings_router = _stub_router("/settings", "Settings")
backup_router = _stub_router("/backup", "Backup")
export_router = _stub_router("/export", "Export")
audit_router = _stub_router("/audit", "Audit")
notifications_router = _stub_router("/notifications", "Notifications")
external_notifications_router = _stub_router("/notifications/external", "External Notifications")
versions_router = _stub_router("/versions", "Versions")
favorites_router = _stub_router("/favorites", "Favorites")
templates_router = _stub_router("/templates", "Templates")
recent_files_router = _stub_router("/recent-files", "Recent Files")
workflow_router = _stub_router("/workflow", "Workflow")
teams_router = _stub_router("/teams", "Teams")
scheduler_router = _stub_router("/scheduler", "Scheduler")
diagrams_router = _stub_router("/diagrams", "Diagrams")
users_router = _stub_router("/users", "Users")

STUB_ROUTERS = [
    terraform_router,
    yaml_router,
    github_router,
    ai_router,
    projects_router,
    files_router,
    conversion_router,
    compliance_router,
    chat_router,
    history_router,
    analytics_router,
    settings_router,
    backup_router,
    export_router,
    audit_router,
    notifications_router,
    external_notifications_router,
    versions_router,
    favorites_router,
    templates_router,
    recent_files_router,
    workflow_router,
    teams_router,
    scheduler_router,
    diagrams_router,
    users_router,
]
