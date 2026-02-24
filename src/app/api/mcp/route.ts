import { TOOL_DEFINITIONS, callTool } from '@/lib/mcp/tools';

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(req: Request): boolean {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace('Bearer ', '').trim();
  return token === process.env.MCP_SECRET_KEY;
}

// ─── JSON-RPC helpers ─────────────────────────────────────────────────────────

function ok(id: unknown, result: unknown) {
  return Response.json({ jsonrpc: '2.0', id, result });
}

function err(id: unknown, code: number, message: string) {
  return Response.json({ jsonrpc: '2.0', id, error: { code, message } });
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return err(null, -32001, 'Unauthorized');
  }

  let body: { jsonrpc: string; method: string; params?: Record<string, unknown>; id?: unknown };
  try {
    body = await req.json();
  } catch {
    return err(null, -32700, 'Parse error');
  }

  const { method, params, id } = body;

  // initialize
  if (method === 'initialize') {
    return ok(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'yam-dash', version: '1.0.0' },
    });
  }

  // initialized notification (pas de réponse attendue)
  if (method === 'notifications/initialized') {
    return new Response(null, { status: 204 });
  }

  // tools/list
  if (method === 'tools/list') {
    return ok(id, { tools: TOOL_DEFINITIONS });
  }

  // tools/call
  if (method === 'tools/call') {
    const { name, arguments: args = {} } = params as { name: string; arguments?: Record<string, string> };
    try {
      const data = await callTool(name, args);
      return ok(id, {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur inconnue';
      return ok(id, {
        content: [{ type: 'text', text: `Erreur : ${message}` }],
        isError: true,
      });
    }
  }

  return err(id, -32601, `Method not found: ${method}`);
}
