import { NextRequest, NextResponse } from 'next/server';
import { createShopfrontMcpServer } from '../../mcp/server.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';

export async function POST(req: NextRequest) {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless per PRD 5.2 & 11.1
    enableJsonResponse: true,
  });
  const server = createShopfrontMcpServer(req);
  await server.connect(transport);
  return await transport.handleRequest(req);
}

export async function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: 'POST' } });
}

export async function DELETE() {
  return new NextResponse(null, { status: 405, headers: { Allow: 'POST' } });
}
