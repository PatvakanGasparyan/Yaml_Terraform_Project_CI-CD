import json
from typing import Any

from openai import OpenAI

from app.core.config import get_settings
from app.core.logging import get_logger
from app.schemas.common import FileFormat, ValidationIssue

logger = get_logger(__name__)


class OpenAIService:
    """Centralized OpenAI client — port of apps/backend/src/services/openai/."""

    def __init__(self) -> None:
        settings = get_settings()
        self._client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        self._model = settings.openai_model

    def is_configured(self) -> bool:
        return self._client is not None

    def _complete(
        self,
        system: str,
        user: str,
        json_mode: bool = False,
    ) -> str:
        if not self._client:
            raise RuntimeError("OpenAI API key not configured")
        kwargs: dict[str, Any] = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        response = self._client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""

    def validate_with_ai(self, content: str, fmt: FileFormat) -> list[ValidationIssue]:
        raw = self._complete(
            system=f'Expert IaC validator for {fmt}. Return JSON: {{"issues":[...]}}',
            user=f"Format: {fmt}\n\n```\n{content[:12000]}\n```",
            json_mode=True,
        )
        try:
            data = json.loads(raw)
            return [ValidationIssue(**i) for i in data.get("issues", [])]
        except (json.JSONDecodeError, TypeError) as exc:
            logger.warning("ai_validate_parse_failed", error=str(exc))
            return []

    def fix(self, content: str, fmt: FileFormat, issues: list[ValidationIssue]) -> str:
        issue_text = "\n".join(f"- L{i.line}: {i.message}" for i in issues[:20])
        return self._complete(
            system=f"Fix all issues in this {fmt} file. Return ONLY corrected content.",
            user=f"Issues:\n{issue_text}\n\n```\n{content[:12000]}\n```",
        )
