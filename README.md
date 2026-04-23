# Novada Web Unblocker Skill + MCP

开源项目：通过 MCP 工具接入 Novada Web Unblocker API，支持动态渲染抓取、国家代理、等待策略、HTML/PNG 输出。

- Novada 官网: [https://www.novada.com](https://www.novada.com)
- Web Unblocker API Endpoint: `https://webunlocker.novada.com/request`

## Features

- MCP tools:
  - `webunblocker_request`
  - `set_api_key`
  - `get_api_key_status`
  - `clear_api_key`
- API key 本地持久化（默认路径：`~/.novada-webunblocker/config.json`）
- 首次调用无 key 时，自动触发 MCP `elicitation` 输入框，用户输入后自动保存本地
- 不支持输入框的客户端自动回退到 `set_api_key` 流程

## Quick Start

```bash
npm install
npm run build
```

本地启动：

```bash
npm start
```

## Codex MCP Config

将如下内容加入 `~/.codex/config.toml`（Windows 路径按实际修改）：

```toml
[mcp_servers.novada_webunblocker]
command = "node"
args = ["C:/Users/user/.codex/skills/novada-webunblocker-skill/dist/index.js"]

[mcp_servers.novada_webunblocker.env]
NOVADA_WEBUNBLOCKER_ENDPOINT = "https://webunlocker.novada.com/request"
NOVADA_WEBUNBLOCKER_TIMEOUT_MS = "45000"
NOVADA_WEBUNBLOCKER_CONFIG_PATH = "C:/Users/user/.novada-webunblocker/config.json"
NOVADA_WEBUNBLOCKER_OUTPUT_DIR = "C:/Users/user/.novada-webunblocker/html"
```

## Tool Usage

### 1) 手动配置 API Key（可选）

```text
set_api_key({ "api_key": "YOUR_API_KEY" })
```

### 2) 直接抓取（未配置 key 时会弹输入框）

```json
{
  "target_url": "https://www.google.com",
  "response_format": "html",
  "js_render": true,
  "wait_ms": 3000
}
```

## Request Parameters (Supported)

- `target_url` (required)
- `response_format`: `html` / `png`
- `js_render`: `true` / `false`
- `country`
- `block_resources`: `["image" | "javascript" | "video"]`
- `clear`: `["js" | "css"]`
- `wait_ms`
- `wait_selector`
- `headers`: `[{"name":"...","value":"..."}]`
- `cookies`: `[{"name":"...","value":"..."}]`
- `follow_redirects`
- `save_html_to_file`: save extracted HTML into a local file
- `output_dir`: optional output directory (defaults to `~/.novada-webunblocker/html`)
- `output_filename`: optional file name (`.html` is auto-appended)
- `include_body_in_response`: include full response body in tool output (defaults to `false` when saving file)

## Save Long HTML To File

When scraping large, JS-rendered pages, use file mode to avoid large inline payloads:

```json
{
  "target_url": "https://www.tiktok.com/shop/pdp/...",
  "response_format": "html",
  "js_render": true,
  "wait_selector": "#pdp-review-section",
  "save_html_to_file": true,
  "output_dir": "C:/Users/user/Desktop/scraped_html",
  "output_filename": "tiktok-pdp.html",
  "include_body_in_response": false
}
```

## Dev

```bash
npm run dev
npm test
```
