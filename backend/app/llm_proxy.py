import json
import os
import re
import time

import httpx

from .config import Settings


class LLMError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


def _parse_json_response(raw: str) -> dict:
    """Parse JSON from LLM response, with code-fence fallback."""
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
    mermaid = parsed.get("mermaid_code")

    if not explanation or not isinstance(explanation, str):
        raise LLMError(
            "LLM 响应缺少或无效的 'explanation_markdown' 字段"
        )
    if not mermaid or not isinstance(mermaid, str):
        raise LLMError("LLM 响应缺少或无效的 'mermaid_code' 字段")


PROXY_KEYS = [
    "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY",
    "http_proxy", "https_proxy", "all_proxy",
]


async def call_llm(shader_source: str, settings: Settings) -> dict:
    from .prompts import SYSTEM_PROMPT, build_user_message

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": build_user_message(shader_source)},
    ]

    started = time.monotonic()

    saved = {}
    for k in PROXY_KEYS:
        if k in os.environ:
            saved[k] = os.environ.pop(k)

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    settings.llm_api_url,
                    json={
                        "model": settings.llm_model,
                        "messages": messages,
                        "temperature": settings.llm_temperature,
                        "max_tokens": settings.llm_max_tokens,
                    },
                    headers={
                        "Authorization": f"Bearer {settings.llm_api_key}",
                        "Content-Type": "application/json",
                    },
                )
            except httpx.TimeoutException:
                raise LLMError("LLM 请求超时", status_code=503)
            except httpx.RequestError as e:
                raise LLMError(f"LLM 请求失败：{e}", status_code=503)
    finally:
        for k, v in saved.items():
            os.environ[k] = v

    elapsed = time.monotonic() - started

    if response.status_code != 200:
        raise LLMError(
            f"LLM API 返回状态码 {response.status_code}", status_code=502
        )

    data = response.json()
    choices = data.get("choices")
    if not choices or not isinstance(choices, list):
        raise LLMError("LLM API 响应缺少 'choices' 字段", status_code=502)

    content = choices[0].get("message", {}).get("content", "")
    if not content:
        raise LLMError("LLM 返回了空响应", status_code=502)

    parsed = _parse_json_response(content)
    _validate_response(parsed)

    return {
        "explanation_markdown": parsed["explanation_markdown"],
        "mermaid_code": parsed["mermaid_code"],
        "model_used": settings.llm_model,
        "elapsed_ms": round(elapsed * 1000),
    }
