from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import Settings
from . import shaders
from .llm_proxy import LLMError, call_llm

app = FastAPI(title="GPU 调试工作室")
settings = Settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/samples")
async def list_samples():
    return {"samples": shaders.list_samples()}


@app.get("/api/samples/{name}")
async def get_sample(name: str):
    source = shaders.load_sample(name)
    if source is None:
        raise HTTPException(status_code=404, detail={"error": "未找到该示例"})
    return {"name": name, "source": source}


class AnalyzeRequest(BaseModel):
    shader_source: str
    shader_name: str | None = None


@app.post("/api/analyze")
async def analyze(payload: AnalyzeRequest):
    source = payload.shader_source.strip()
    if not source:
        raise HTTPException(status_code=400, detail={"error": "Shader 源码为空"})

    if not settings.llm_api_key:
        raise HTTPException(
            status_code=503,
            detail={"error": "LLM 未配置 — 请在 backend/.env 中设置 LLM_API_KEY"},
        )

    try:
        result = await call_llm(source, settings)
    except LLMError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"error": str(e)},
        )

    return result
