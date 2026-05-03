from pathlib import Path

from pydantic_settings import BaseSettings

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    llm_api_url: str = "https://api.openai.com/v1/chat/completions"
    llm_api_key: str = ""
    llm_model: str = "gpt-4o-mini"
    llm_temperature: float = 0.3
    llm_max_tokens: int = 4096
    host: str = "0.0.0.0"
    port: int = 8000
    samples_dir: str = ""

    model_config = {"env_file": str(_ENV_FILE), "env_file_encoding": "utf-8"}
