import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApiKey, setApiKey } from "../config/index.js";
import { AppError, ERROR_CODES, toAppError } from "../errors.js";
import { callWebUnblocker } from "../services/webunblocker-api.js";
import type { WebUnblockerRequestInput } from "../types/webunblocker.js";
import { saveHtmlPayloadToFile } from "../utils/html-file.js";

interface RequestToolInput extends WebUnblockerRequestInput {
  api_key?: string;
  save_api_key?: boolean;
  save_html_to_file?: boolean;
  output_dir?: string;
  output_filename?: string;
  include_body_in_response?: boolean;
}

const requestToolInputSchema = {
  target_url: z.string().url(),
  response_format: z.enum(["html", "png"]).optional(),
  js_render: z.boolean().optional(),
  country: z.string().optional(),
  block_resources: z
    .array(z.enum(["image", "javascript", "video"]))
    .optional(),
  clear: z.array(z.enum(["js", "css"])).optional(),
  wait_ms: z.number().int().min(0).optional(),
  wait_selector: z.string().optional(),
  headers: z
    .array(
      z.object({
        name: z.string().min(1),
        value: z.string()
      })
    )
    .optional(),
  cookies: z
    .array(
      z.object({
        name: z.string().min(1),
        value: z.string()
      })
    )
    .optional(),
  follow_redirects: z.boolean().optional(),
  api_key: z.string().min(1).optional(),
  save_api_key: z.boolean().optional(),
  save_html_to_file: z.boolean().optional(),
  output_dir: z.string().min(1).optional(),
  output_filename: z.string().min(1).optional(),
  include_body_in_response: z.boolean().optional()
};

function jsonResult(
  value: unknown
): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

function toolError(error: unknown): Error {
  const normalized = toAppError(error);
  return new Error(`[${normalized.code}] ${normalized.message}`);
}

function extractApiKeyFromElicitationResult(result: unknown): string | null {
  if (!result || typeof result !== "object") {
    return null;
  }

  const asRecord = result as Record<string, unknown>;
  if (asRecord.action !== "accept") {
    return null;
  }

  if (!asRecord.content || typeof asRecord.content !== "object") {
    return null;
  }

  const content = asRecord.content as Record<string, unknown>;
  const candidate = content.api_key;
  if (typeof candidate !== "string") {
    return null;
  }

  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function promptApiKeyWithElicitation(
  server: McpServer
): Promise<string | null> {
  try {
    const result = await server.server.elicitInput({
      mode: "form",
      message:
        "首次使用 Novada Web Unblocker 需要 API Key。请输入 API Key（将保存到本地配置文件）。",
      requestedSchema: {
        type: "object",
        properties: {
          api_key: {
            type: "string",
            title: "Novada API Key",
            description: "在 Novada 控制台获取",
            minLength: 1
          }
        },
        required: ["api_key"]
      }
    });

    return extractApiKeyFromElicitationResult(result);
  } catch {
    return null;
  }
}

async function resolveApiKey(
  input: RequestToolInput,
  server: McpServer
): Promise<string> {
  const provided = input.api_key?.trim();
  if (provided) {
    if (input.save_api_key === true) {
      setApiKey(provided);
    }
    return provided;
  }

  const localKey = getApiKey();
  if (localKey) {
    return localKey;
  }

  const elicitedKey = await promptApiKeyWithElicitation(server);
  if (elicitedKey) {
    setApiKey(elicitedKey);
    return elicitedKey;
  }

  throw new AppError(
    ERROR_CODES.API_KEY_MISSING,
    "API key is missing. Use set_api_key tool first, or call webunblocker_request and enter key in the prompt."
  );
}

export async function requestHandler(
  input: RequestToolInput,
  server: McpServer
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    if (input.save_html_to_file === true && input.response_format === "png") {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "save_html_to_file cannot be used when response_format is png."
      );
    }

    const apiKey = await resolveApiKey(input, server);
    const {
      api_key: _apiKey,
      save_api_key: _saveApiKey,
      save_html_to_file: saveHtmlToFile = false,
      output_dir: outputDir,
      output_filename: outputFileName,
      include_body_in_response: includeBodyInResponse,
      ...requestInput
    } = input;

    const result = await callWebUnblocker(requestInput, apiKey, {
      maxTextChars: saveHtmlToFile ? null : undefined
    });

    const shouldIncludeBody = includeBodyInResponse ?? !saveHtmlToFile;
    const savedHtmlFile =
      saveHtmlToFile && result.bodyText
        ? saveHtmlPayloadToFile({
            bodyText: result.bodyText,
            targetUrl: requestInput.target_url,
            outputDir,
            outputFilename: outputFileName
          })
        : undefined;

    if (saveHtmlToFile && !savedHtmlFile) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "save_html_to_file requires a text response that contains HTML."
      );
    }

    return jsonResult({
      status: result.status,
      content_type: result.contentType,
      bytes: result.bytes,
      body_truncated: result.bodyTruncated,
      body_text: shouldIncludeBody ? result.bodyText : undefined,
      body_base64: shouldIncludeBody ? result.bodyBase64 : undefined,
      response_headers: result.responseHeaders,
      saved_html_file: savedHtmlFile,
      body_omitted: shouldIncludeBody ? undefined : true
    });
  } catch (error) {
    throw toolError(error);
  }
}

export function registerRequestTools(server: McpServer): void {
  server.registerTool(
    "webunblocker_request",
    {
      description:
        "Send request to Novada Web Unblocker API. Supports optional HTML file persistence for large responses.",
      inputSchema: requestToolInputSchema
    },
    async (input) => requestHandler(input, server)
  );
}
