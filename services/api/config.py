from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://ainurse:ainurse@localhost:5432/ainurse"

    class Config:
        env_file = ".env"

settings = Settings()
