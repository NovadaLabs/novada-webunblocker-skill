---
name: novada-webunblocker
description: Novada Web Unblocker scraping skill via MCP. Use when user needs anti-bot page fetch, JS rendering, country proxy, wait selector, custom headers/cookies, or HTML/PNG capture.
---

# Novada Web Unblocker Skill

Use this skill to fetch target pages through Novada Web Unblocker MCP tools.

## Workflow

1. Prefer `webunblocker_request` for all scraping calls.
2. If first use has no local API key, the MCP tool will open a form input box; after user submits, key is persisted locally.
3. If client does not support form elicitation, ask user for API key and call `set_api_key`.
4. For dynamic pages, set `js_render=true` and optionally `wait_ms` or `wait_selector`.
5. For long HTML pages, prefer saving HTML to disk with `save_html_to_file=true` and return `saved_html_file.path`.
6. Keep responses concise: summarize key data first, then attach raw payload only when user asks.

## Tools

- `webunblocker_request({ target_url, response_format?, js_render?, country?, block_resources?, clear?, wait_ms?, wait_selector?, headers?, cookies?, follow_redirects?, api_key?, save_api_key?, save_html_to_file?, output_dir?, output_filename?, include_body_in_response? })`
- `set_api_key({ api_key })`
- `get_api_key_status({})`
- `clear_api_key({})`

## Parameter Hints

- `response_format`: `html` (default) or `png`
- `block_resources`: `image`, `javascript`, `video`
- `clear`: `js`, `css`
- `headers` / `cookies`: list of `{ name, value }`
- `save_html_to_file`: when `true`, saves extracted HTML into a local `.html` file
- `output_dir`: optional directory for HTML output (default: `~/.novada-webunblocker/html`)
- `output_filename`: optional file name (auto-generated if omitted)
- `include_body_in_response`: optional; default is `false` when saving to file
