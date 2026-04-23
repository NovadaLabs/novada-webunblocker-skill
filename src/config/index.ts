import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DEFAULT_CONFIG_PATH = path.join(
  os.homedir(),
  ".novada-webunblocker",
  "config.json"
);

interface PersistedConfig {
  api_key?: string;
}

function ensureParentDirectory(configPath: string): void {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readConfig(configPath: string): PersistedConfig {
  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw) as PersistedConfig;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    return {};
  }

  return {};
}

export function resolveConfigPath(): string {
  return process.env.NOVADA_WEBUNBLOCKER_CONFIG_PATH ?? DEFAULT_CONFIG_PATH;
}

export function getApiKey(): string | null {
  const config = readConfig(resolveConfigPath());
  if (!config.api_key || typeof config.api_key !== "string") {
    return null;
  }

  const trimmed = config.api_key.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function hasApiKey(): boolean {
  return getApiKey() !== null;
}

export function setApiKey(apiKey: string): void {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new Error("API key cannot be empty.");
  }

  const configPath = resolveConfigPath();
  ensureParentDirectory(configPath);
  const current = readConfig(configPath);
  const next: PersistedConfig = {
    ...current,
    api_key: trimmed
  };

  fs.writeFileSync(configPath, JSON.stringify(next, null, 2), "utf8");
}

export function clearApiKey(): void {
  const configPath = resolveConfigPath();
  const current = readConfig(configPath);
  const next: PersistedConfig = { ...current };
  delete next.api_key;

  ensureParentDirectory(configPath);
  fs.writeFileSync(configPath, JSON.stringify(next, null, 2), "utf8");
}

export function maskApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) {
    return `${trimmed.slice(0, 2)}***`;
  }
  return `${trimmed.slice(0, 4)}***${trimmed.slice(-4)}`;
}
