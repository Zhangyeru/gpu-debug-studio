# GPU Debug Studio

基于大语言模型的 Shader 算法分析工具。左侧编辑代码，右侧 AI 生成算法说明与优化建议，支持代码↔说明双向联动高亮。

## 功能

- **AI 算法分析** — 大模型自动解析 Shader 算法逻辑，输出结构化的逐步说明
- **性能优化建议** — 识别性能瓶颈，给出 3-5 条具体可执行的优化方案
- **行号联动** — 点击说明中的 `[第X行]` 标签高亮左侧代码；点击代码行高亮右侧对应说明
- **多输入方式** — 支持代码编辑器粘贴、文件上传、内置示例加载
- **多 LLM 支持** — 兼容所有 OpenAI 接口格式的大模型（DeepSeek、GPT、通义千问等）

## 环境要求

- **Node.js** ≥ 18
- **Python** ≥ 3.12
- **npm** ≥ 9

## 快速开始

### 1. 安装依赖

```bash
# 前端
npm install

# 后端
cd backend
pip install -e .
cd ..
```

### 2. 配置 LLM

```bash
cp backend/.env.example backend/.env
```

编辑 `backend/.env`，填入你的 API 密钥和模型：

```env
LLM_API_URL=https://api.deepseek.com/v1/chat/completions
LLM_API_KEY=sk-your-api-key-here
LLM_MODEL=deepseek-chat
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=12288
```

支持的 LLM 服务商示例：

| 服务商 | LLM_API_URL | 模型示例 |
|--------|------------|---------|
| DeepSeek | `https://api.deepseek.com/v1/chat/completions` | `deepseek-chat`, `deepseek-v4-pro` |
| OpenAI | `https://api.openai.com/v1/chat/completions` | `gpt-4o`, `gpt-4o-mini` |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` | `qwen-plus` |
| 其他兼容接口 | 按服务商文档填写 | 按服务商文档填写 |

### 3. 启动服务

**终端 1 — 启动后端（端口 8000）：**

```bash
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**终端 2 — 启动前端（端口 5173）：**

```bash
npm run dev
```

### 4. 打开浏览器

访问 **http://localhost:5173**

## 使用方式

1. 在左侧编辑器粘贴 GLSL/HLSL Shader 代码，或点击 **上传** 选择文件，或点击顶部示例按钮
2. 点击 **分析**，等待 AI 生成结果（复杂 Shader 可能需要 2-3 分钟）
3. 右侧查看 **算法步骤** 和 **性能优化** 两个标签页
4. 点击蓝色 `[第X行]` 标签高亮左侧对应代码
5. 点击左侧代码行，右侧自动定位到相关说明

## 配置说明

### 环境变量

所有配置通过 `backend/.env` 文件设置：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `LLM_API_URL` | LLM API 端点地址 | `https://api.openai.com/v1/chat/completions` |
| `LLM_API_KEY` | API 密钥 | 无（必须设置） |
| `LLM_MODEL` | 模型名称 | `gpt-4o-mini` |
| `LLM_TEMPERATURE` | 生成随机性（0-1） | `0.3` |
| `LLM_MAX_TOKENS` | 最大输出 Token | `12288` |

### 超时设置

复杂 Shader 分析可能耗时较长，默认超时 5 分钟。如需调整：

- 后端：`backend/app/llm_proxy.py` — `httpx.AsyncClient(timeout=300.0)`
- 前端：`src/services/api.ts` — `setTimeout(..., 300000)`

## 项目结构

```
gpu-debug-studio/
├── index.html                    # Vite 入口 HTML
├── package.json                  # 前端依赖配置
├── vite.config.ts                # Vite 配置（含 API 代理）
├── tsconfig.json                 # TypeScript 配置
├── src/                          # 前端源码
│   ├── main.tsx                  # React 入口
│   ├── App.tsx                   # 根组件：状态管理、双向联动
│   ├── types/index.ts            # TypeScript 类型定义
│   ├── services/api.ts           # API 请求封装
│   ├── components/
│   │   ├── ShaderEditor.tsx      # 左侧：CodeMirror 编辑器 + 上传
│   │   ├── FileUpload.tsx        # 文件上传组件
│   │   ├── SampleSelector.tsx    # 示例 Shader 选择器
│   │   ├── ResultPanel.tsx       # 右侧：标签页容器 + scrollToLine
│   │   ├── ExplanationTab.tsx    # Markdown 渲染 + 行号标签
│   │   ├── LoadingState.tsx      # 加载骨架屏
│   │   └── ErrorBanner.tsx       # 错误提示横幅
│   └── styles/global.css         # 全局样式
├── backend/                      # 后端源码
│   ├── pyproject.toml            # Python 项目配置
│   ├── .env.example              # 环境变量模板
│   ├── .env                      # 实际环境变量（不提交）
│   ├── samples/                  # 内置示例 Shader
│   │   ├── texture_loop.frag     # 纹理循环采样
│   │   ├── branchy.frag          # 条件分支
│   │   ├── conversion.frag       # 类型转换
│   │   ├── simple_blur.frag      # 高斯模糊
│   │   └── ssao.frag             # HBAO 环境光遮蔽
│   └── app/
│       ├── main.py               # FastAPI 应用入口 + API 路由
│       ├── config.py             # 配置管理（pydantic-settings）
│       ├── llm_proxy.py          # LLM API 调用 + JSON 解析
│       ├── prompts.py            # System Prompt 模板
│       └── shaders.py            # 示例 Shader 管理
├── nginx.conf                    # Nginx 反向代理配置
├── gpu-debug-studio.service      # systemd 服务文件
├── DESIGN.md                     # 软件设计文档
├── AI_CODING.md                  # AI Coding 总结
└── README.md
```

## 生产部署

以下命令在 Ubuntu/Debian 服务器上一次性完成部署。

### 一键部署

```bash
# 1. 安装系统依赖
sudo apt update && sudo apt install -y nginx python3-pip nodejs npm

# 2. 安装项目依赖
cd /home/anfield/project/gpu-debug-studio
npm install
cd backend && pip install -e . && cd ..

# 3. 配置 LLM（替换为你的 API Key）
cp backend/.env.example backend/.env
sed -i 's/sk-your-api-key-here/sk-你的真实密钥/' backend/.env

# 4. 构建前端
npm run build

# 5. 启动后端（systemd 托管）
sudo cp gpu-debug-studio.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now gpu-debug-studio

# 6. 配置 Nginx 反向代理
sudo cp nginx.conf /etc/nginx/sites-available/gpu-debug-studio
sudo ln -sf /etc/nginx/sites-available/gpu-debug-studio /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo nginx -s reload

# 7. 验证
curl http://localhost/health     # → {"status":"ok"}
curl http://localhost/api/samples # → {"samples":[...]}
```

### 分步说明

#### 第一步：安装依赖

```bash
sudo apt update
sudo apt install -y nginx python3-pip nodejs npm
cd /home/anfield/project/gpu-debug-studio

# 前端依赖
npm install

# 后端依赖
cd backend
pip install -e .
cd ..
```

#### 第二步：配置 LLM

```bash
cp backend/.env.example backend/.env
vim backend/.env    # 填入 LLM_API_KEY、LLM_MODEL 等
```

#### 第三步：构建前端

```bash
npm run build       # 输出到 dist/，由 nginx 直接托管
```

#### 第四步：启动后端

```bash
# 安装 systemd 服务（开机自启 + 异常自动重启）
sudo cp gpu-debug-studio.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now gpu-debug-studio

# 开发调试可不使用 systemd，直接运行：
# cd backend && uvicorn app.main:app --host 127.0.0.1 --port 8000
```

#### 第五步：配置 Nginx

```bash
sudo cp nginx.conf /etc/nginx/sites-available/gpu-debug-studio
sudo ln -sf /etc/nginx/sites-available/gpu-debug-studio /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default    # 移除默认站点
sudo nginx -t                                   # 测试配置
sudo nginx -s reload                            # 重载生效
```

#### 第六步：验证部署

```bash
# 健康检查
curl http://localhost/health
# → {"status":"ok"}

# 示例列表
curl http://localhost/api/samples
# → {"samples":[...]}

# 分析测试
curl -X POST http://localhost/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"shader_source":"#version 450\nvoid main(){ outColor=vec4(1.0); }"}'
```

### 请求链路

```
浏览器 → http://<server>
           │
           ▼
      Nginx (:80)
       │         │
       │ 静态文件  │ /api/* 代理
       ▼         ▼
    dist/    uvicorn (:8000)
                  │
                  ▼
            LLM API
```

### 更新部署

```bash
# 拉取最新代码
git pull

# 更新依赖
npm install
cd backend && pip install -e . && cd ..

# 重新构建前端
npm run build

# 重启后端
sudo systemctl restart gpu-debug-studio
```

### 常用运维命令

```bash
# 后端
sudo systemctl status gpu-debug-studio      # 查看状态
sudo journalctl -u gpu-debug-studio -f      # 实时日志
sudo systemctl restart gpu-debug-studio     # 重启
sudo systemctl stop gpu-debug-studio        # 停止

# Nginx
sudo nginx -t                                # 测试配置
sudo nginx -s reload                         # 热重载
sudo tail -f /var/log/nginx/gpu-debug-studio-access.log  # 访问日志
sudo tail -f /var/log/nginx/gpu-debug-studio-error.log   # 错误日志

# 查看端口占用
sudo ss -tlnp | grep -E '80|8000'
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/api/samples` | 获取示例列表 |
| GET | `/api/samples/{name}` | 获取指定示例源码 |
| POST | `/api/analyze` | 分析 Shader，返回算法说明和优化建议 |

### POST /api/analyze

请求：
```json
{
  "shader_source": "#version 450\nvoid main() { ... }",
  "shader_name": "example.frag"
}
```

响应：
```json
{
  "explanation_markdown": "## 整体概述\n...",
  "optimization_markdown": "## 性能分析\n...",
  "model_used": "deepseek-chat",
  "elapsed_ms": 12345
}
```

## 技术栈

| 层 | 技术 |
|---|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 6 |
| 代码编辑器 | CodeMirror 6 + GLSL 语法高亮 |
| Markdown 渲染 | react-markdown + remark-gfm |
| 代码高亮 | react-syntax-highlighter |
| 后端框架 | FastAPI (Python) |
| ASGI 服务器 | uvicorn |
| HTTP 客户端 | httpx |
| 配置管理 | pydantic-settings |
| LLM 接口 | OpenAI 兼容 Chat Completions API |
