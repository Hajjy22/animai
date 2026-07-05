#!/usr/bin/env node

import { runCli } from "./cli.js";
import { runMcpServer } from "./mcp.js";

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);

  if (command === "mcp") {
    await runMcpServer();
    return;
  }

  await runCli([command ?? "", ...rest]);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`AnimAI failed: ${message}`);
  process.exit(1);
});
