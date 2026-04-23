import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractHtmlPayload,
  saveHtmlPayloadToFile
} from "../src/utils/html-file.js";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "novada-webunblocker-html-"));
}

describe("html payload extraction", () => {
  it("extracts data.html from json envelope", () => {
    const wrapped = JSON.stringify({
      code: 0,
      data: {
        html: "<!DOCTYPE html><html><body>ok</body></html>"
      }
    });

    const html = extractHtmlPayload(wrapped);
    expect(html).toBe("<!DOCTYPE html><html><body>ok</body></html>");
  });

  it("returns null for non-html text", () => {
    expect(extractHtmlPayload("{\"hello\":\"world\"}")).toBeNull();
  });
});

describe("html payload persistence", () => {
  it("saves extracted html to output directory", () => {
    const outputDir = makeTempDir();
    const wrapped = JSON.stringify({
      data: {
        html: "<html><body>saved</body></html>"
      }
    });

    const result = saveHtmlPayloadToFile({
      bodyText: wrapped,
      targetUrl: "https://example.com/path/to/page",
      outputDir
    });

    expect(result.path.startsWith(outputDir)).toBe(true);
    expect(result.filename.endsWith(".html")).toBe(true);
    expect(fs.existsSync(result.path)).toBe(true);
    expect(fs.readFileSync(result.path, "utf8")).toContain("saved");
  });
});
