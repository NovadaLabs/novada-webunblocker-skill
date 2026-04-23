import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  clearApiKey,
  getApiKey,
  resolveConfigPath,
  setApiKey
} from "../src/config/index.js";

const originalPath = process.env.NOVADA_WEBUNBLOCKER_CONFIG_PATH;

afterEach(() => {
  if (originalPath === undefined) {
    delete process.env.NOVADA_WEBUNBLOCKER_CONFIG_PATH;
  } else {
    process.env.NOVADA_WEBUNBLOCKER_CONFIG_PATH = originalPath;
  }
});

function makeTempConfigPath(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "novada-webunblocker-test-"));
  return path.join(dir, "config.json");
}

describe("config api key persistence", () => {
  it("writes and reads api key from custom path", () => {
    const configPath = makeTempConfigPath();
    process.env.NOVADA_WEBUNBLOCKER_CONFIG_PATH = configPath;

    setApiKey("test-key-123");

    expect(resolveConfigPath()).toBe(configPath);
    expect(getApiKey()).toBe("test-key-123");
  });

  it("clears api key", () => {
    const configPath = makeTempConfigPath();
    process.env.NOVADA_WEBUNBLOCKER_CONFIG_PATH = configPath;

    setApiKey("test-key-123");
    clearApiKey();

    expect(getApiKey()).toBeNull();
  });
});
