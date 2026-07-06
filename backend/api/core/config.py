from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "TopoAcoustic Orchestration API"
    HNSW_NODE_URL: str = "http://localhost:8000"
    SUPABASE_URL: str = "https://xyzcompany.supabase.co"
    SUPABASE_KEY: str = "public-anon-key"
    SUPABASE_JWT_SECRET: str = "your-super-secret-jwt-token-with-at-least-32-characters-long"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
