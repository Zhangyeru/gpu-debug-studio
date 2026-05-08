import json
import os
import re
import time

from openai import AsyncOpenAI

from .config import Settings

# 系统环境变量中的 socks:// 代理不被 httpx 支持，需要临时清除
_PROXY_KEYS = [
    "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY",
    "http_proxy", "https_proxy", "all_proxy",
]


class LLMError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


def _parse_json_response(raw: str) -> dict:
    """从 LLM 响应中解析 JSON，含 markdown code-fence 容错。"""
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{[\s\S]*\}", raw)
    if match:
        try:
            return json.loads(match[0])
        except json.JSONDecodeError:
            pass

    raise LLMError("LLM 返回了无法解析的内容 — 未找到合法 JSON")


def _validate_response(parsed: dict) -> None:
    explanation = parsed.get("explanation_markdown")
    optimization = parsed.get("optimization_markdown")

    if not explanation or not isinstance(explanation, str):
        raise LLMError(
            "LLM 响应缺少或无效的 'explanation_markdown' 字段"
        )
    if not optimization or not isinstance(optimization, str):
        raise LLMError(
            "LLM 响应缺少或无效的 'optimization_markdown' 字段"
        )


async def call_llm(shader_source: str, settings: Settings) -> dict:
    from .prompts import SYSTEM_PROMPT, build_user_message

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": build_user_message(shader_source)},
    ]

    # 清除不被 httpx 支持的 socks:// 代理环境变量
    saved = {}
    for k in _PROXY_KEYS:
        if k in os.environ:
            saved[k] = os.environ.pop(k)

    try:
        client = AsyncOpenAI(
            base_url=settings.llm_api_url,
            api_key=settings.llm_api_key,
            timeout=300.0,
        )

        started = time.monotonic()

        completion = await client.chat.completions.create(
            model=settings.llm_model,
            messages=messages,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
        )
    except Exception as e:
        raise LLMError(f"LLM 请求失败：{e}", status_code=503)
    finally:
        for k, v in saved.items():
            os.environ[k] = v

    elapsed = time.monotonic() - started

    content = completion.choices[0].message.content
    if not content:
        raise LLMError("LLM 返回了空响应", status_code=502)

    parsed = _parse_json_response(content)
    _validate_response(parsed)

    return {
        "explanation_markdown": parsed["explanation_markdown"],
        "optimization_markdown": parsed["optimization_markdown"],
        "model_used": settings.llm_model,
        "elapsed_ms": round(elapsed * 1000),
    }
