// =============================================
// CLIENTE DE SUPABASE PARA BROWSER (Client Components)
// =============================================

import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[supabase] Missing env vars");
    // Return dummy client that won't crash
    return createBrowserClient("https://placeholder.supabase.co", "placeholder");
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}
