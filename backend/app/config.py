from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    google_maps_api_key: str = ""
    stripe_secret_key: str = ""
    redis_url: str = "redis://localhost:6379"
    
    # Email Settings (SMTP)
    email_host: str = "smtp.gmail.com"
    email_port: int = 587
    email_username: str = ""
    email_password: str = ""
    email_from: str = "noreply@voyago.com"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
