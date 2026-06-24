from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])
_auth = AuthService()


@router.post("/register", response_model=TokenResponse)
def register(dto: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return _auth.register(db, dto)


@router.post("/login", response_model=TokenResponse)
def login(dto: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return _auth.login(db, dto)


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)) -> UserResponse:
    return AuthService.to_response(user)
