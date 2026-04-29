"""
Configuration Settings
Loads environment variables from .env file
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """
    Application settings loaded from .env file
    """
    
    # Database Configuration
    DATABASE_URL: str

    MYSQLHOST: str | None = None
    MYSQLUSER: str | None = None
    MYSQLPASSWORD: str | None = None
    MYSQLDATABASE: str | None = None
    MYSQLPORT: int | None = 3306
    
    # JWT Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Application
    APP_NAME: str = "QR Library Management System"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
