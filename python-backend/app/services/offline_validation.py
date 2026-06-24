import re
import time
from typing import Literal

import yaml

from app.schemas.common import FileFormat, ValidationIssue, ValidationResult

SEVERITY_WEIGHTS = {"critical": 25, "high": 15, "medium": 8, "low": 3, "info": 1}


def detect_format(content: str, file_name: str | None = None) -> FileFormat:
    if file_name:
        ext = file_name.rsplit(".", 1)[-1].lower()
        mapping = {
            "yaml": "yaml", "yml": "yaml", "tf": "terraform", "tfvars": "tfvars",
            "json": "json", "xml": "xml", "toml": "toml", "ini": "ini",
            "hcl": "hcl", "env": "env", "csv": "csv", "md": "markdown",
        }
        if ext in mapping:
            return mapping[ext]  # type: ignore[return-value]
    stripped = content.strip()
    if stripped.startswith("{"):
        return "json"
    if "resource " in content or "provider " in content:
        return "terraform"
    return "yaml"


class OfflineValidationService:
    """Port of NestJS OfflineValidationService — syntax and structure checks."""

    def validate(
        self,
        content: str,
        fmt: FileFormat | None = None,
        file_name: str | None = None,
    ) -> ValidationResult:
        start = time.perf_counter()
        detected = fmt or detect_format(content, file_name)
        issues: list[ValidationIssue] = []

        if detected in ("yaml", "kubernetes", "docker-compose", "github-actions", "helm", "openapi"):
            issues.extend(self._validate_yaml(content, detected))
        elif detected == "terraform":
            issues.extend(self._validate_terraform(content))
        elif detected == "json":
            issues.extend(self._validate_json(content))

        critical_high = [i for i in issues if i.severity in ("critical", "high")]
        score = max(0, 100 - sum(SEVERITY_WEIGHTS.get(i.severity, 1) for i in issues))

        return ValidationResult(
            valid=len(critical_high) == 0,
            format=detected,
            issues=issues,
            score=score,
            duration_ms=int((time.perf_counter() - start) * 1000),
        )

    def _validate_yaml(self, content: str, schema: str) -> list[ValidationIssue]:
        issues: list[ValidationIssue] = []
        try:
            docs = list(yaml.safe_load_all(content))
            if not docs or all(d is None for d in docs):
                issues.append(ValidationIssue(
                    severity="high", message="Empty or invalid YAML document", category="syntax"
                ))
            if schema == "kubernetes":
                for doc in docs:
                    if isinstance(doc, dict) and not doc.get("apiVersion"):
                        issues.append(ValidationIssue(
                            severity="high",
                            message="Kubernetes resource missing apiVersion",
                            category="kubernetes",
                        ))
        except yaml.YAMLError as exc:
            issues.append(ValidationIssue(
                severity="critical", message=f"YAML parse error: {exc}", category="syntax"
            ))
        return issues

    def _validate_terraform(self, content: str) -> list[ValidationIssue]:
        issues: list[ValidationIssue] = []
        brace_balance = content.count("{") - content.count("}")
        if brace_balance != 0:
            issues.append(ValidationIssue(
                severity="critical",
                message=f"Unbalanced braces ({brace_balance:+d})",
                category="syntax",
            ))
        for i, line in enumerate(content.splitlines(), 1):
            if re.search(r'password\s*=\s*"[^"]+"', line, re.I):
                issues.append(ValidationIssue(
                    severity="high",
                    message="Hardcoded password detected",
                    line=i,
                    category="security",
                    suggestion="Use variables or secrets manager",
                ))
        return issues

    def _validate_json(self, content: str) -> list[ValidationIssue]:
        import json
        try:
            json.loads(content)
            return []
        except json.JSONDecodeError as exc:
            return [ValidationIssue(
                severity="critical", message=f"JSON parse error: {exc.msg}", line=exc.lineno, category="syntax"
            )]
