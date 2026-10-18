import fs from 'fs';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

if (typeof process.loadEnvFile === 'function' && fs.existsSync(envPath)) {
  try {
    process.loadEnvFile(envPath);
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
