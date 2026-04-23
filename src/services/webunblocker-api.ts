import { AppError, ERROR_CODES } from "../errors.js";
import type {
  WebUnblockerRequestInput,
  WebUnblockerResult
} from "../types/webunblocker.js";

const DEFAULT_ENDPOINT = "https://webunlocker.novada.com/request";
const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_MAX_TEXT_CHARS = 12_000;
const DEFAULT_MAX_BASE64_CHARS = 120_000;

export interface WebUnblockerCallOptions {
  maxTextChars?: number | null;
  maxBase64Chars?: number | null;
}

const STATUS_HINTS: Record<number, string> = {
  400: "Malformed request. Check parameter names and values.",
  401: "Authorization failed. API key is missing or invalid.",
  403: "Forbidden. Your account cannot access this target.",
  429: "Rate limit exceeded. Retry later.",
  500: "Novada internal error. Retry later.",
  503: "Failed after retries on Novada side. Retry is usually safe.",
  504: "Request timed out on Novada side."
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function resolveTimeoutMs(): number {
  return parsePositiveInt(
    process.env.NOVADA_WEBUNBLOCKER_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS
  );
}

function resolveEndpoint(): string {
  return process.env.NOVADA_WEBUNBLOCKER_ENDPOINT ?? DEFAULT_ENDPOINT;
}

function resolveMaxTextChars(): number {
  return parsePositiveInt(
    process.env.NOVADA_WEBUNBLOCKER_MAX_TEXT_CHARS,
    DEFAULT_MAX_TEXT_CHARS
  );
}

function resolveMaxBase64Chars(): number {
  return parsePositiveInt(
    process.env.NOVADA_WEBUNBLOCKER_MAX_BASE64_CHARS,
    DEFAULT_MAX_BASE64_CHARS
  );
}

function normalizeMaxChars(
  override: number | null | undefined,
  fallback: number
): number | null {
  if (override === null) {
    return null;
  }
  if (override === undefined) {
    return fallback;
  }
  if (!Number.isFinite(override) || override <= 0) {
    return null;
  }
  return Math.floor(override);
}

function toRecord(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function buildFormBody(input: WebUnblockerRequestInput): URLSearchParams {
  const params = new URLSearchParams();
  params.set("target_url", input.target_url);

  if (input.response_format) {
    params.set("response_format", input.response_format);
  }
  if (input.js_render !== undefined) {
    params.set("js_render", input.js_render ? "True" : "False");
  }
  if (input.country) {
    params.set("country", input.country);
  }
  if (input.block_resources && input.block_resources.length > 0) {
    params.set("block_resources", input.block_resources.join(","));
  }
  if (input.clear && input.clear.length > 0) {
    params.set("clear", input.clear.join(","));
  }
  if (input.wait_ms !== undefined) {
    params.set("wait_ms", String(input.wait_ms));
  }
  if (input.wait_selector) {
    params.set("wait_selector", input.wait_selector);
  }
  if (input.headers && input.headers.length > 0) {
    params.set("headers", JSON.stringify(input.headers));
  }
  if (input.cookies && input.cookies.length > 0) {
    params.set("cookies", JSON.stringify(input.cookies));
  }
  if (input.follow_redirects !== undefined) {
    params.set("follow_redirects", input.follow_redirects ? "true" : "false");
  }

  return params;
}

function buildHttpErrorMessage(status: number): string {
  const hint = STATUS_HINTS[status];
  if (hint) {
    return `Novada Web Unblocker returned HTTP ${status}. ${hint}`;
  }
  return `Novada Web Unblocker returned HTTP ${status}.`;
}

function decodeUtf8(buffer: Buffer): string {
  return buffer.toString("utf8");
}

function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return new AppError(
      ERROR_CODES.UPSTREAM_TIMEOUT,
      `Novada request timed out after ${resolveTimeoutMs()}ms.`,
      { cause: error }
    );
  }

  if (error instanceof Error) {
    return new AppError(ERROR_CODES.NETWORK_ERROR, error.message, {
      cause: error
    });
  }

  return new AppError(ERROR_CODES.NETWORK_ERROR, "Unknown network error.");
}

export async function callWebUnblocker(
  payload: WebUnblockerRequestInput,
  apiKey: string,
  options: WebUnblockerCallOptions = {}
): Promise<WebUnblockerResult> {
  const timeoutMs = resolveTimeoutMs();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(resolveEndpoint(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: buildFormBody(payload).toString(),
      signal: controller.signal
    });

    const rawBuffer = Buffer.from(await response.arrayBuffer());
    const contentType =
      response.headers.get("content-type") ?? "application/octet-stream";
    const responseHeaders = toRecord(response.headers);

    if (!response.ok) {
      const preview = decodeUtf8(rawBuffer).slice(0, 1000);
      throw new AppError(
        ERROR_CODES.UPSTREAM_HTTP_ERROR,
        buildHttpErrorMessage(response.status),
        {
          status: response.status,
          details: {
            preview
          }
        }
      );
    }

    if (contentType.includes("image/")) {
      const base64 = rawBuffer.toString("base64");
      const maxBase64Chars = normalizeMaxChars(
        options.maxBase64Chars,
        resolveMaxBase64Chars()
      );
      const isTruncated =
        maxBase64Chars !== null && base64.length > maxBase64Chars;
      return {
        status: response.status,
        contentType,
        responseHeaders,
        bytes: rawBuffer.byteLength,
        bodyBase64:
          isTruncated && maxBase64Chars !== null
            ? base64.slice(0, maxBase64Chars)
            : base64,
        bodyTruncated: isTruncated
      };
    }

    const text = decodeUtf8(rawBuffer);
    const maxTextChars = normalizeMaxChars(
      options.maxTextChars,
      resolveMaxTextChars()
    );
    const isTruncated = maxTextChars !== null && text.length > maxTextChars;

    return {
      status: response.status,
      contentType,
      responseHeaders,
      bytes: rawBuffer.byteLength,
      bodyText:
        isTruncated && maxTextChars !== null
          ? text.slice(0, maxTextChars)
          : text,
      bodyTruncated: isTruncated
    };
  } catch (error) {
    throw normalizeError(error);
  } finally {
    clearTimeout(timer);
  }
}
