# Novada Web Unblocker Skill + MCP

Open-source skill for accessing the Novada Web Unblocker API through MCP tools.  
It supports dynamic JS-rendered scraping, country routing, wait strategies, and HTML/PNG outputs.

- Novada website: [https://www.novada.com](https://www.novada.com)
- Web Unblocker API endpoint: `https://webunlocker.novada.com/request`

## Features

- MCP tools:
  - `webunblocker_request`
  - `set_api_key`
  - `get_api_key_status`
  - `clear_api_key`
- API key is persisted locally (default path: `~/.novada-webunblocker/config.json`)
- On first request without a local key, MCP `elicitation` is triggered for key input and auto-save
- For clients without elicitation UI, use `set_api_key` as fallback

## Quick Start

```bash
npm install
npm run build
```

Run locally:

```bash
npm start
```

## Codex MCP Config

Add the following to `~/.codex/config.toml` (adjust Windows paths to your environment):

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

### 1) Set API key manually (optional)

```text
set_api_key({ "api_key": "YOUR_API_KEY" })
```

### 2) Basic scraping request

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

When scraping large JS-rendered pages, use file mode to avoid oversized inline payloads:

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

## Codex Prompt Templates

### 1) Quick Prompt (Short)

```text
Use $novada-webunblocker to scrape this page: https://www.tiktok.com/shop/pdp/womens-seamless-yoga-jumpsuit-ribbed-square-neck-tight-fit/1731734246290723668, enable JS rendering, and wait until #pdp-review-section is loaded.
```

### 2) Full Prompt (Detailed)

```text
Please use $novada-webunblocker to scrape a page with the following requirements:
1. target_url: https://www.tiktok.com/shop/pdp/womens-seamless-yoga-jumpsuit-ribbed-square-neck-tight-fit/1731734246290723668
2. Enable JS rendering (js_render=true)
3. Wait for selector #pdp-review-section (wait_selector="#pdp-review-section")
4. Return HTML format (response_format="html")
5. Save HTML to local file (save_html_to_file=true)
6. Do not include full body in response by default (include_body_in_response=false)

After execution, return:
- Status code (status)
- Summary of effective request parameters
- Saved file path (saved_html_file.path)
- Whether the waiting selector was matched (for example, id="pdp-review-section")
- If failed, include root cause and next-step suggestions (such as increasing wait_ms, changing country, or adding headers/cookies).
```

## Dev

```bash
npm run dev
npm test
```

