# GPU Debug Studio — 软件设计文档

## 1. 概述

### 1.1 项目背景

GPU Debug Studio 是一款面向 GPU Shader 开发者的算法分析工具。开发者提交 GLSL/HLSL Shader 源码后，系统调用大语言模型（LLM）自动分析 Shader 的算法逻辑，生成结构化的逐步说明和性能优化建议。前端提供代码↔说明双向联动高亮的交互体验。

### 1.2 核心功能

| 功能 | 说明 |
|------|------|
| AI 算法分析 | LLM 解析 Shader 算法，输出结构化 Markdown 说明 |
| 性能优化建议 | 识别瓶颈（带宽/ALU/分支），给出 3-5 条可执行方案 |
| 行号双向联动 | 点击说明中的行号标签 → 左侧代码高亮；点击代码行 → 右侧说明定位 |
| 多输入方式 | 代码编辑器粘贴、.frag/.vert 文件上传、内置示例加载 |
| 多 LLM 兼容 | 支持所有 OpenAI Chat Completions 接口格式的大模型 |

### 1.3 技术选型

| 层 | 技术 | 选择理由 |
|---|------|---------|
| 前端框架 | React 18 + TypeScript | 团队既有技术栈，类型安全 |
| 构建工具 | Vite 6 | 开发热更新快，构建体积小 |
| 代码编辑器 | CodeMirror 6 | 轻量、支持 GLSL 语法高亮、丰富的扩展 API |
| Markdown 渲染 | react-markdown + remark-gfm | 安全渲染 Markdown，支持 GFM 扩展语法 |
| 后端框架 | FastAPI | 异步支持好、自动 OpenAPI 文档、类型校验 |
| HTTP 客户端 | httpx | 异步 HTTP，超时控制 |
| 配置管理 | pydantic-settings | 类型安全的 .env 加载 |
| LLM 协议 | OpenAI Chat Completions | 业界标准，兼容最多模型 |

---

## 2. 系统架构

### 2.1 架构总览

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (:5173)                     │
│  ┌──────────────────────┐  ┌───────────────────────────┐│
│  │    ShaderEditor       │  │      ResultPanel          ││
│  │  (CodeMirror 6 +      │  │  ┌─────────────────────┐  ││
│  │   GLSL highlight)     │  │  │  算法步骤 │ 性能优化  │  ││
│  │                       │  │  ├─────────────────────┤  ││
│  │  highlightLines()     │  │  │  ExplanationTab     │  ││
│  │  onLineClick ↑        │  │  │  (react-markdown)   │  ││
│  └──────────────────────┘  │  └─────────────────────┘  ││
│           ↕                │  scrollToLine(line)        ││
│      App.tsx 双向桥接       └───────────────────────────┘│
└───────────────────┬─────────────────────────────────────┘
                    │ Vite proxy: /api → :8002
┌───────────────────▼─────────────────────────────────────┐
│                 Backend (:8002)                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              FastAPI Application                   │   │
│  │  GET  /health                                     │   │
│  │  GET  /api/samples                                │   │
│  │  GET  /api/samples/{name}                         │   │
│  │  POST /api/analyze  ───► llm_proxy.call_llm()     │   │
│  └──────────────────────────────────────────────────┘   │
│           │                                              │
│  ┌────────▼──────────┐    ┌─────────────────────┐       │
│  │   llm_proxy.py    │    │   prompts.py         │       │
│  │  - JSON 解析      │◄───│  - System Prompt     │       │
│  │  - 字段校验       │    │  - User Message 构建 │       │
│  │  - 超时/错误处理  │    └─────────────────────┘       │
│  └────────┬──────────┘                                   │
└───────────┼─────────────────────────────────────────────┘
            │ httpx (300s timeout, 禁用环境代理)
┌───────────▼─────────────────────────────────────────────┐
│              LLM API (OpenAI 兼容)                        │
│  POST /v1/chat/completions                               │
│  { model, messages, temperature, max_tokens }            │
└─────────────────────────────────────────────────────────┘
```

### 2.2 部署架构

开发环境采用前后端分离 + Vite 代理模式：

- **前端**：Vite Dev Server 监听 `:5173`，`/api` 和 `/health` 请求代理到 `:8002`
- **后端**：uvicorn 监听 `:8002`，CORS 全开（开发阶段）
- **无需 Nginx**：开发阶段 Vite proxy 即可解决跨域

---

## 3. 前端设计

### 3.1 组件树

```
<App>  ── useState: shaderSource, shaderName, result, loading, error
│        ── useRef: editorRef (ShaderEditorHandle), resultPanelRef (ResultPanelHandle)
│
├── <header>
│   ├── <h1> "GPU 调试工作室"
│   └── <p>  副标题
│
├── <SampleSelector onSelect={handleSampleSelect}>
│   └── fetchSamples() → 渲染 chip 按钮 → fetchSampleSource(name)
│
└── <main.layout>  ── CSS Grid: 1fr 1fr
    │
    ├── <ShaderEditor ref={editorRef} onLineClick={handleCodeLineClick}>
    │   ├── <FileUpload onFileContent>  ── FileReader → onChange
    │   ├── <div.editor-wrapper>        ── CodeMirror 6 挂载点
    │   └── <button "分析">
    │
    └── <ResultPanel ref={resultPanelRef} onLineClick={handleLineClick}>
        ├── <ErrorBanner>  ── 条件渲染（error 非空时）
        ├── <LoadingState> ── 条件渲染（loading 时）
        ├── <div.tab-bar>
        │   ├── <button "算法步骤">
        │   └── <button "性能优化">
        └── <ExplanationTab markdown={...} onLineClick>
            └── react-markdown + 自定义 a 组件 → <span.line-ref>
```

### 3.2 核心组件详设

#### ShaderEditor（左侧面板）

- **职责**：GLSL 代码编辑、文件上传、分析触发、行高亮
- **对外接口**（`forwardRef` → `useImperativeHandle`）：
  - `highlightLines(from, to)` — 高亮指定行范围，3 秒自动消失
- **内部实现**：
  - CodeMirror 6 + `codemirror-lang-glsl` + `@codemirror/theme-one-dark`
  - 高亮采用 DOM 直接操作：`view.domAtPos(pos)` → 定位 `.cm-line` → `classList.add('cm-highlighted-line')`
  - 行号点击：监听编辑器 click 事件 → 通过 `.cm-line` 在父元素中的索引计算行号 → `onLineClick(line)`

#### ExplanationTab（Markdown 渲染）

- **职责**：渲染 LLM 输出的 Markdown，解析行号引用为可点击标签
- **行号处理流程**：
  1. 正则预处理：`[第8行]` → `[第8行](#L8-8)`，`[第3-5行]` → `[第3-5行](#L3-5)`
  2. react-markdown 渲染时，自定义 `a` 组件拦截 `#LX-Y` 链接
  3. 渲染为 `<span className="line-ref" data-from="X" data-to="Y" onClick={...}>`
  4. 点击触发 `onLineClick(from, to)` → App → `editorRef.current.highlightLines(from, to)`

#### ResultPanel（右侧面板）

- **职责**：标签页容器、左侧点击代码行 → 右侧定位说明
- **对外接口**（`forwardRef` → `useImperativeHandle`）：
  - `scrollToLine(line)` — 查找 `data-from ≤ line ≤ data-to` 的 `.line-ref`，`scrollIntoView` 平滑滚动，`.line-ref-highlight` 高亮 2 秒
- **内部状态**：`tab` — 切换 "算法步骤" / "性能优化"

### 3.3 状态管理

不使用全局状态库（Redux/Zustand），所有状态通过 `App.tsx` 的 `useState` 管理，props 向下传递：

```typescript
// App.tsx — 所有状态集中在根组件
const [shaderSource, setShaderSource] = useState(INITIAL_SHADER);
const [shaderName, setShaderName] = useState('untitled.frag');
const [result, setResult] = useState<AnalysisResult | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**双向联动数据流：**

```
右侧 → 左侧（点击行号标签）：
  ExplanationTab.onClick → onLineClick(from, to)
  → App.handleLineClick(from, to)
  → editorRef.current.highlightLines(from, to)
  → CodeMirror DOM: classList.add('cm-highlighted-line')

左侧 → 右侧（点击代码行）：
  ShaderEditor click 事件 → onLineClick(line)
  → App.handleCodeLineClick(line)
  → resultPanelRef.current.scrollToLine(line)
  → querySelectorAll('.line-ref') → scrollIntoView → classList.add('line-ref-highlight')
```

### 3.4 防竞态处理

分析请求采用 `AbortController` 模式防止过期响应覆盖新结果：

```typescript
const abortRef = useRef<AbortController | null>(null);

const handleAnalyze = useCallback(async () => {
  abortRef.current?.abort();        // 取消上一个请求
  abortRef.current = new AbortController();
  setLoading(true);
  try {
    const analysis = await analyzeShader(source, shaderName);
    setResult(analysis);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return;
    setError(err.message);
  }
}, [shaderSource, shaderName]);
```

---

## 4. 后端设计

### 4.1 模块划分

```
backend/app/
├── main.py          # FastAPI 应用入口、路由注册、全局异常处理
├── config.py        # Settings 类：pydantic-settings 加载 .env
├── llm_proxy.py     # LLM API 代理：请求构建、JSON 解析、字段校验
├── prompts.py       # Prompt 模板：System Prompt + User Message 构建
└── shaders.py       # 示例 Shader 管理：列表、加载
```

### 4.2 API 路由

| 方法 | 路径 | 处理函数 | 说明 |
|------|------|---------|------|
| GET | `/health` | `health()` | 健康检查，返回 `{"status":"ok"}` |
| GET | `/api/samples` | `list_samples()` | 返回可用示例列表 |
| GET | `/api/samples/{name}` | `get_sample(name)` | 返回指定示例源码，404 如不存在 |
| POST | `/api/analyze` | `analyze(payload)` | 分析 Shader，返回算法说明和优化建议 |

### 4.3 POST /api/analyze 请求处理流程

```
1. 校验 shader_source 非空 → 400 错误
2. 校验 LLM API Key 已配置 → 503 错误
3. 调用 llm_proxy.call_llm(source, settings):
   a. 构建 messages = [system_prompt, user_message(source_with_line_numbers)]
   b. 清除环境代理变量（避免 socks:// 冲突）
   c. httpx.AsyncClient(timeout=300) POST 到 LLM API
   d. 解析 JSON 响应（含 markdown code-fence 容错）
   e. 校验 explanation_markdown 和 optimization_markdown 字段
   f. 恢复环境代理变量（finally 块）
4. 返回 AnalysisResult
```

### 4.4 错误处理策略

| 场景 | HTTP 状态码 | 错误信息 |
|------|-----------|---------|
| Shader 源码为空 | 400 | "Shader 源码为空" |
| LLM API Key 未配置 | 503 | "LLM 未配置" |
| LLM 请求超时（300s） | 503 | "LLM 请求超时" |
| LLM 返回非 JSON | 502 | "LLM 返回了无法解析的内容" |
| 响应缺少必要字段 | 502 | "LLM 响应缺少或无效的 'xxx' 字段" |
| LLM API 返回非 200 | 502 | "LLM API 返回状态码 {code}" |
| 示例不存在 | 404 | "未找到该示例" |
| 请求转发失败 | 503 | "LLM 请求失败：{详情}" |

### 4.5 代理兼容处理

系统环境变量中存在 `ALL_PROXY=socks://127.0.0.1:7890/`，httpx 不支持 socks 协议。解决方案：在调用 LLM API 前临时清除相关环境变量，调用后恢复：

```python
PROXY_KEYS = ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY",
              "http_proxy", "https_proxy", "all_proxy"]

saved = {}
for k in PROXY_KEYS:
    if k in os.environ:
        saved[k] = os.environ.pop(k)
try:
    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(...)
finally:
    for k, v in saved.items():
        os.environ[k] = v
```

---

## 5. LLM Prompt 设计

### 5.1 System Prompt 结构

```
角色定义：GPU Shader 分析专家
输出格式：合法 JSON，两个字段
  ├── explanation_markdown：算法实现原理（概述 + 步骤 + 数据流 + 控制流）
  │   └── 约束：每个步骤必须用 [第X-Y行] 标注行号
  └── optimization_markdown：性能分析与优化建议
      ├── 性能瓶颈识别（纹理/ALU/分支/带宽）
      ├── ALU 与带宽评估
      └── 3-5 条优化建议（原理 + 收益 + 行号）
```

### 5.2 User Message 构建

发送给 LLM 的源码会添加行号前缀，确保 LLM 能准确引用：

```
请分析以下 GLSL Shader（ssao.frag）。源码行号如下：

```glsl
1: #version 460
2: #extension GL_EXT_samplerless_texture_functions : require
3:
4: float _78;
...
```

### 5.3 设计考量

| 决策 | 理由 |
|------|------|
| Temperature = 0.3 | 需要稳定的 JSON 输出和准确的行号引用 |
| 行号前缀标注 | LLM 需要明确的行号来生成 [第X-Y行] 引用 |
| JSON 格式输出 | 便于解析和字段拆分，实现标签页分离 |
| Markdown code-fence 容错 | LLM 有时会忽略"只输出 JSON"的指令，加正则回退 |
| max_tokens = 12288 | 复杂 Shader（100+ 行）的分析 + 优化建议需要较长的输出 |

---

## 6. 交互设计

### 6.1 双向联动机制

```
┌─────────────────────┐          ┌─────────────────────────┐
│    左侧 编辑器        │          │     右侧 说明面板         │
│                     │          │                         │
│  1  #version 450    │  ──点击──→│  ### 1. 纹理采样 [第8行] │
│  2                  │          │  ...                    │
│  8  vec4 color = .. │←──高亮── │  [第8行] ← 点击这个标签   │
│  9  if (uv.x > 0.5) │          │                         │
└─────────────────────┘          └─────────────────────────┘
```

### 6.2 高亮视觉规范

- **左侧代码高亮**：蓝色半透明背景 `rgba(88,166,255,0.22)` + 3px 蓝色左边框，3 秒淡出
- **右侧说明高亮**：蓝色背景 `rgba(88,166,255,0.35)` + 2px 蓝色外框 + `border-radius: 4px`，2 秒淡出
- **平滑滚动**：`scrollIntoView({ behavior: 'smooth', block: 'center' })`

---

## 7. 数据模型

### 7.1 前端类型

```typescript
// 分析请求
type AnalyzeRequest = {
  shader_source: string;
  shader_name?: string;
};

// 分析结果
type AnalysisResult = {
  explanation_markdown: string;     // 算法步骤（Markdown）
  optimization_markdown: string;    // 性能优化建议（Markdown）
  model_used: string;               // 使用的模型名称
  elapsed_ms: number;               // LLM 耗时（毫秒）
};

// 示例 Shader
type ShaderSample = {
  name: string;    // 文件名，如 "ssao.frag"
  label: string;   // 显示名，如 "SSAO"
};

// 组件间接口
type ShaderEditorHandle = {
  highlightLines: (from: number, to: number) => void;
};

type ResultPanelHandle = {
  scrollToLine: (line: number) => void;
};
```

### 7.2 后端配置模型

```python
class Settings(BaseSettings):
    llm_api_url: str       # LLM API 地址
    llm_api_key: str       # API 密钥
    llm_model: str         # 模型名称
    llm_temperature: float # 生成温度
    llm_max_tokens: int    # 最大输出 Token

    model_config = {"env_file": str(_ENV_FILE)}
```

---

## 8. 关键设计决策

| 决策 | 选型 | 备选方案 | 理由 |
|------|------|---------|------|
| 编辑器高亮方式 | DOM 直接操作 | StateField + Decoration API | DOM 方式更简单可靠，避免 CodeMirror 版本兼容问题 |
| LLM 调用方式 | 后端代理 | 浏览器直接调用 | API Key 不暴露到前端，可加缓存/日志扩展 |
| 状态管理 | useState | Redux/Zustand | 单页面应用状态简单，不需要全局状态库 |
| 路由 | 无路由库 | React Router | 单页面应用无需路由，手动切换标签页即可 |
| 行号处理 | 正则预处理 + Markdown 链接 | rehype-raw + 原始 HTML | 避免 HTML 注入风险，利用标准 Markdown 链接语义 |
| 竞态处理 | AbortController | 请求序列化 | 允许用户快速重新分析，旧请求直接取消 |

---

## 9. 待扩展方向

- **流式响应** — 改为 SSE/WebSocket，逐步展示 LLM 生成内容
- **多 Shader 对比** — 同时加载两个 Shader 进行 diff 分析
- **SPIR-V 预分析** — 先编译为 SPIR-V 提取控制流图，辅助 LLM 更准确分析
- **历史记录** — 保存分析历史，支持回溯
- **导出报告** — 一键导出 Markdown/PDF 分析报告
- **本地模型支持** — 集成 Ollama/vLLM 等本地推理引擎
- **暗色/亮色主题切换** — 满足不同使用习惯
