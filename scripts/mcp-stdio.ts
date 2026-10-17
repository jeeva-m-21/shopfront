import fs from 'fs';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env')) {
  try {
    process.loadEnvFile('.env');
  } catch {
    // Ignore error if already loaded
  }
}

import { createShopfrontMcpServer } from '../src/mcp/server.js';

async function main() {
  const server = createShopfrontMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('Fatal MCP Stdio Server error:', err);
  process.exit(1);
});
