import { createServer, startServer } from "./server.js";
import { registerAuthTools } from "./tools/auth.js";
import { registerRequestTools } from "./tools/request.js";
import { logError, logInfo } from "./utils/logger.js";

async function main(): Promise<void> {
  const server = createServer();
  registerAuthTools(server);
  registerRequestTools(server);
  logInfo("Starting MCP stdio server...");
  await startServer(server);
}

main().catch((error) => {
  logError("Server failed to start.", error);
  process.exitCode = 1;
});
