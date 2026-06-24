import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AuthProvider(str, enum.Enum):
    local = "local"
    google = "google"
    github = "github"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    provider: Mapped[AuthProvider] = mapped_column(Enum(AuthProvider), default=AuthProvider.local)
    provider_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    github_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    settings: Mapped["Settings"] = relationship(back_populates="user", uselist=False)


class Settings(Base):
    __tablename__ = "settings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    theme: Mapped[str] = mapped_column(String(20), default="system")
    language: Mapped[str] = mapped_column(String(10), default="en")
    editor_font_size: Mapped[int] = mapped_column(default=14)
    editor_theme: Mapped[str] = mapped_column(String(50), default="vs-dark")
    auto_save: Mapped[bool] = mapped_column(Boolean, default=True)
    auto_fix: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_model: Mapped[str] = mapped_column(String(50), default="gpt-4o")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped[User] = relationship(back_populates="settings", primaryjoin="Settings.user_id==User.id")
