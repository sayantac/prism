from functools import lru_cache
from typing import List, Optional

from pydantic import BaseSettings, PostgresDsn


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Ecommerce Backend"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Advanced Ecommerce Backend with Vector Search"

    SECRET_KEY: str = "ABCD1234EFGH5678IJKL9012MNOP3456QRST7890UVWX"
    JWT_ISSUER: str = "ecommerce-backend"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    POSTGRES_SERVER = "localhost"
    POSTGRES_USER: str = "tanmay"
    POSTGRES_PASSWORD: str = "123"
    POSTGRES_DB: str = "ecommerce"
    POSTGRES_PORT: str = "5432"
    DATABASE_URL: Optional[PostgresDsn] = (
        "postgresql://tanmay:123@localhost:5432/ecommerce"
    )

    # @validator("DATABASE_URL", pre=True)
    # def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
    #     if isinstance(v, str):
    #         return v
    #     return PostgresDsn.build(
    #         scheme="postgresql",
    #         user=values.get("POSTGRES_USER"),
    #         password=values.get("POSTGRES_PASSWORD"),
    #         host=values.get("POSTGRES_SERVER"),
    #         port=values.get("POSTGRES_PORT"),
    #         path=f"/{values.get('POSTGRES_DB') or ''}",
    # )

    UPLOAD_FOLDER = "static/uploads"

    MAX_FILE_SIZE = 10 * 1024 * 1024
    ALLOWED_IMAGE_EXTENSIONS: set = {"png", "jpg", "jpeg", "gif", "webp"}

    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"
    DEBUG = False
    FIRST_SUPERUSER_USERNAME: str = "admin"
    FIRST_SUPERUSER_EMAIL: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "admin123"


@lru_cache()
def get_settings():
    return Settings()
