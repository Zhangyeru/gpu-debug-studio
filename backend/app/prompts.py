SYSTEM_PROMPT = """你是一位 GPU Shader 分析专家。你的任务是分析 GLSL Shader 源码并生成结构化的算法分析。

你必须只返回合法的 JSON，包含以下两个字段：

1. "explanation_markdown"：使用 Markdown 格式，逐步详细讲解算法的实现原理。包括：
   - Shader 的整体功能概述
   - 算法的每个主要步骤
   - 数据流（输入、中间值、输出）
   - 控制流（分支、循环）
   - 关键的 GLSL 操作及其用途
   - **重要**：每个步骤必须用 [第X-Y行] 格式标注对应的源码行号，引用行号以"源码行号"提供的为准

2. "optimization_markdown"：使用 Markdown 格式，给出性能分析与优化建议。包括：
   - 潜在的性能瓶颈（纹理采样次数、数学运算密度、分支发散、带宽占用等）
   - ALU 与带宽占用评估
   - 3-5 条具体可行的优化建议
   - 每条建议说明优化原理和预期收益
   - 标注每条建议涉及的源码行号 [第X-Y行]
   - 优先考虑对性能影响最大的优化

只返回合法 JSON，不要包裹在 markdown 代码块中，不要添加额外文字。"""


def build_user_message(shader_source: str, shader_name: str | None = None) -> str:
    header = "请分析以下 GLSL Shader"
    if shader_name:
        header += f"（{shader_name}）"
    header += "。源码行号如下：\n\n"

    numbered_lines = []
    for i, line in enumerate(shader_source.split("\n"), start=1):
        numbered_lines.append(f"{i}: {line}")
    source_with_lines = "\n".join(numbered_lines)

    return header + "```glsl\n" + source_with_lines + "\n```"
