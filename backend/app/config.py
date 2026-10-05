import os
from pydantic_settings import BaseSettings
from typing import List

from pydantic import ConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "HealthEase AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./backend/data/healthease.db")
    
    # AI API Keys (Optional - Intelligent fallback engine operates if empty)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ]
    
    # Security & Storage
    SECRET_KEY: str = os.getenv("SECRET_KEY", "healthease_ai_secure_development_secret_2026")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./backend/uploads")
    MAX_UPLOAD_SIZE_MB: int = 15

    model_config = ConfigDict(env_file=".env", extra="ignore")

settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.dirname(settings.DATABASE_URL.replace("sqlite:///", "")), exist_ok=True)
