// =============================================
// CLIENTE DE SUPABASE PARA BROWSER (Client Components)
// =============================================

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createClient() {
  return createBrowserClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY
  );
}
