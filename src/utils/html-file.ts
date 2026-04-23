import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { AppError, ERROR_CODES } from "../errors.js";

const DEFAULT_HTML_OUTPUT_DIR = path.join(
  os.homedir(),
  ".novada-webunblocker",
  "html"
);

export interface SavedHtmlFile {
  path: string;
  filename: string;
  output_dir: string;
  bytes: number;
}

interface SaveHtmlOptions {
  bodyText: string;
  targetUrl: string;
  outputDir?: string;
  outputFilename?: string;
}

function extractHtmlFromJsonEnvelope(bodyText: string): string | null {
  try {
    const parsed = JSON.parse(bodyText) as { data?: { html?: unknown } };
    if (typeof parsed?.data?.html === "string" && parsed.data.html.length > 0) {
      return parsed.data.html;
    }
  } catch {
    return null;
  }
  return null;
}

export function extractHtmlPayload(bodyText: string): string | null {
  const htmlFromEnvelope = extractHtmlFromJsonEnvelope(bodyText);
  if (htmlFromEnvelope) {
    return htmlFromEnvelope;
  }

  const trimmed = bodyText.trimStart().toLowerCase();
  if (trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html")) {
    return bodyText;
  }

  return null;
}

function sanitizeFileNameSegment(value: string): string {
  const sanitized = value.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return sanitized || "page";
}

function buildDefaultFileName(targetUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return `novada-webunblocker-${Date.now()}.html`;
  }

  const host = sanitizeFileNameSegment(parsed.hostname);
  const pathname = sanitizeFileNameSegment(parsed.pathname || "index");
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+$/, "")
    .replace("T", "-");
  return `${host}-${pathname}-${timestamp}.html`;
}

function resolveOutputDir(outputDir?: string): string {
  const fromInput = outputDir?.trim();
  const fromEnv = process.env.NOVADA_WEBUNBLOCKER_OUTPUT_DIR?.trim();
  const rawDir = fromInput || fromEnv || DEFAULT_HTML_OUTPUT_DIR;
  return path.resolve(rawDir);
}

function normalizeFileName(requestedFileName: string | undefined, targetUrl: string): string {
  const rawName = requestedFileName?.trim() || buildDefaultFileName(targetUrl);
  const baseName = path.basename(rawName);
  const sanitized = sanitizeFileNameSegment(baseName);
  if (sanitized.toLowerCase().endsWith(".html")) {
    return sanitized;
  }
  return `${sanitized}.html`;
}

function makeUniqueFilePath(baseFilePath: string): string {
  if (!fs.existsSync(baseFilePath)) {
    return baseFilePath;
  }

  const dir = path.dirname(baseFilePath);
  const ext = path.extname(baseFilePath);
  const name = path.basename(baseFilePath, ext);

  for (let i = 1; i <= 999; i += 1) {
    const candidate = path.join(dir, `${name}-${i}${ext}`);
    if (!fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.join(dir, `${name}-${Date.now()}${ext}`);
}

export function saveHtmlPayloadToFile(options: SaveHtmlOptions): SavedHtmlFile {
  const html = extractHtmlPayload(options.bodyText);
  if (!html) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      "Could not extract HTML from upstream body_text. Ensure response_format is html."
    );
  }

  const outputDir = resolveOutputDir(options.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  const fileName = normalizeFileName(options.outputFilename, options.targetUrl);
  const rawFilePath = path.join(outputDir, fileName);
  const filePath = makeUniqueFilePath(rawFilePath);
  fs.writeFileSync(filePath, html, "utf8");

  return {
    path: filePath,
    filename: path.basename(filePath),
    output_dir: outputDir,
    bytes: Buffer.byteLength(html, "utf8")
  };
}
