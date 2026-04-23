import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  clearApiKey,
  getApiKey,
  hasApiKey,
  maskApiKey,
  resolveConfigPath,
  setApiKey
} from "../config/index.js";

interface SetApiKeyInput {
  api_key: string;
}

export async function setApiKeyHandler({
  api_key
}: SetApiKeyInput): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  setApiKey(api_key);
  return {
    content: [
      {
        type: "text",
        text: `API key saved to ${resolveConfigPath()}.`
      }
    ]
  };
}

export async function getApiKeyStatusHandler(): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const key = getApiKey();
  if (!key) {
    return {
      content: [
        {
          type: "text",
          text: `API key is not configured. Config path: ${resolveConfigPath()}`
        }
      ]
    };
  }

  return {
    content: [
      {
        type: "text",
        text: `API key is configured (${maskApiKey(
          key
        )}). Config path: ${resolveConfigPath()}`
      }
    ]
  };
}

export async function clearApiKeyHandler(): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  if (!hasApiKey()) {
    return {
      content: [
        {
          type: "text",
          text: "No API key to clear."
        }
      ]
    };
  }

  clearApiKey();
  return {
    content: [
      {
        type: "text",
        text: "API key cleared from local config."
      }
    ]
  };
}

export function registerAuthTools(server: McpServer): void {
  server.registerTool(
    "set_api_key",
    {
      description: "Save Novada Web Unblocker API key to local config.",
      inputSchema: {
        api_key: z.string().min(1)
      }
    },
    setApiKeyHandler
  );

  server.registerTool(
    "get_api_key_status",
    {
      description: "Get persisted API key status and config path.",
      inputSchema: {}
    },
    getApiKeyStatusHandler
  );

  server.registerTool(
    "clear_api_key",
    {
      description: "Remove persisted API key from local config.",
      inputSchema: {}
    },
    clearApiKeyHandler
  );
}
