const PREFIX = "[novada-webunblocker-mcp]";

export function logInfo(message: string, extra?: unknown): void {
  if (extra === undefined) {
    console.error(`${PREFIX} ${message}`);
    return;
  }

  console.error(`${PREFIX} ${message}`, extra);
}

export function logError(message: string, error: unknown): void {
  console.error(`${PREFIX} ${message}`, error);
}
