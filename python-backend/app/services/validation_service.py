from app.models.user import User
from app.schemas.common import ContentRequest, ValidationResult
from app.services.offline_validation import OfflineValidationService
from app.services.openai_service import OpenAIService


class ValidationService:
    def __init__(self) -> None:
        self._offline = OfflineValidationService()
        self._openai = OpenAIService()

    def validate(
        self,
        dto: ContentRequest,
        user: User | None = None,
    ) -> ValidationResult:
        result = self._offline.validate(dto.content, dto.format, dto.file_name)

        if dto.use_ai and user and self._openai.is_configured():
            ai_issues = self._openai.validate_with_ai(dto.content, result.format)
            existing = {(i.line, i.message) for i in result.issues}
            for issue in ai_issues:
                if (issue.line, issue.message) not in existing:
                    result.issues.append(issue)
            critical_high = [i for i in result.issues if i.severity in ("critical", "high")]
            result.valid = len(critical_high) == 0

        return result
