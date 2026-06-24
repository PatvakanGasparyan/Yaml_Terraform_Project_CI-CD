import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.user import AuthProvider, Settings, User
from app.schemas.common import LoginRequest, RegisterRequest, TokenResponse, UserResponse

logger = get_logger(__name__)

DEFAULT_SETTINGS = {
    "theme": "system",
    "language": "en",
    "editor_font_size": 14,
    "editor_theme": "vs-dark",
    "auto_save": True,
    "auto_fix": False,
    "ai_model": "gpt-4o",
}


class AuthService:
    def register(self, db: Session, dto: RegisterRequest) -> TokenResponse:
        if db.query(User).filter(User.email == dto.email).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        user = User(
            id=str(uuid.uuid4()),
            email=dto.email,
            password_hash=hash_password(dto.password),
            name=dto.name,
            provider=AuthProvider.local,
        )
        db.add(user)
        db.add(Settings(id=str(uuid.uuid4()), user_id=user.id, **DEFAULT_SETTINGS))
        db.commit()
        db.refresh(user)
        logger.info("user_registered", user_id=user.id)
        return self._tokens(user)

    def login(self, db: Session, dto: LoginRequest) -> TokenResponse:
        user = db.query(User).filter(User.email == dto.email).first()
        if not user or not user.password_hash or not verify_password(dto.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        db.commit()
        logger.info("user_login", user_id=user.id)
        return self._tokens(user)

    def _tokens(self, user: User) -> TokenResponse:
        return TokenResponse(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
        )

    @staticmethod
    def to_response(user: User) -> UserResponse:
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            avatar_url=user.avatar_url,
            provider=user.provider.value,
        )
