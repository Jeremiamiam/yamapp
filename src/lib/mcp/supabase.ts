import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase admin pour le serveur MCP.
 * Utilise la service_role_key (bypass RLS) — uniquement côté serveur.
 */
export function createMcpClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
