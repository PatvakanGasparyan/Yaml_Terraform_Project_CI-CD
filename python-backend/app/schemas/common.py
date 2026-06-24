from typing import Literal

from pydantic import BaseModel, EmailStr, Field

Severity = Literal["critical", "high", "medium", "low", "info"]
FileFormat = Literal[
    "yaml", "terraform", "tfvars", "json", "xml", "toml", "ini",
    "docker-compose", "kubernetes", "helm", "ansible", "cloudformation",
    "openapi", "github-actions", "gitlab-ci", "jenkins", "crd", "hcl",
    "properties", "env", "csv", "markdown", "unknown",
]


class ValidationIssue(BaseModel):
    line: int | None = None
    column: int | None = None
    severity: Severity
    message: str
    rule: str | None = None
    suggestion: str | None = None
    category: str | None = None


class ValidationResult(BaseModel):
    valid: bool
    format: FileFormat
    issues: list[ValidationIssue]
    score: int | None = None
    duration_ms: int


class ContentRequest(BaseModel):
    content: str = Field(..., min_length=1)
    file_name: str | None = None
    format: FileFormat | None = None
    use_ai: bool = False


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: str | None = None
    provider: str

    model_config = {"from_attributes": True}
