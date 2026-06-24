from fastapi import APIRouter, Depends

from app.core.deps import get_current_user, get_optional_user
from app.models.user import User
from app.schemas.common import ContentRequest, ValidationResult
from app.services.validation_service import ValidationService

router = APIRouter(prefix="/validation", tags=["Validation"])
_service = ValidationService()


@router.post("", response_model=ValidationResult)
def validate(
    dto: ContentRequest,
    user: User | None = Depends(get_optional_user),
) -> ValidationResult:
    return _service.validate(dto, user)
