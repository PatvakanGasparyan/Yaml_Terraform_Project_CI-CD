from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = Field(default="IaC Platform", alias="APP_NAME")
    app_env: Literal["development", "staging", "production"] = Field(
        default="development", alias="APP_ENV"
    )
    app_debug: bool = Field(default=False, alias="APP_DEBUG")
    app_url: str = Field(default="http://localhost:3000", alias="APP_URL")
    api_prefix: str = Field(default="/api/v1", alias="API_PREFIX")
    port: int = Field(default=4000, alias="PORT")

    database_url: str = Field(
        default="postgresql+psycopg2://iac_user:iac_password@localhost:5432/iac_platform",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    jwt_secret: str = Field(default="change-me", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_expire_minutes: int = Field(default=10080, alias="JWT_ACCESS_EXPIRE_MINUTES")
    jwt_refresh_secret: str = Field(default="change-me-refresh", alias="JWT_REFRESH_SECRET")
    jwt_refresh_expire_days: int = Field(default=30, alias="JWT_REFRESH_EXPIRE_DAYS")

    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o", alias="OPENAI_MODEL")

    storage_type: Literal["local", "s3"] = Field(default="local", alias="STORAGE_TYPE")
    storage_local_path: str = Field(default="./uploads", alias="STORAGE_LOCAL_PATH")
    s3_endpoint: str = Field(default="", alias="S3_ENDPOINT")
    s3_bucket: str = Field(default="iac-platform", alias="S3_BUCKET")
    s3_access_key: str = Field(default="", alias="S3_ACCESS_KEY")
    s3_secret_key: str = Field(default="", alias="S3_SECRET_KEY")
    s3_region: str = Field(default="us-east-1", alias="S3_REGION")

    smtp_host: str = Field(default="", alias="SMTP_HOST")
    smtp_port: int = Field(default=587, alias="SMTP_PORT")
    smtp_secure: bool = Field(default=False, alias="SMTP_SECURE")
    smtp_user: str = Field(default="", alias="SMTP_USER")
    smtp_password: str = Field(default="", alias="SMTP_PASSWORD")
    smtp_from: str = Field(default="iac-platform@localhost", alias="SMTP_FROM")
    slack_webhook_url: str = Field(default="", alias="SLACK_WEBHOOK_URL")
    telegram_bot_token: str = Field(default="", alias="TELEGRAM_BOT_TOKEN")
    telegram_chat_id: str = Field(default="", alias="TELEGRAM_CHAT_ID")

    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    log_json: bool = Field(default=False, alias="LOG_JSON")

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
