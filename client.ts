import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

// Singleton pattern — her render'da yeni client oluşturulmasın
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase ortam değişkenleri eksik.\n" +
      "NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY " +
      ".env.local dosyasına eklenmeli."
    );
  }

  client = createBrowserClient<Database>(url, key);
  return client;
}

// Server Component / Route Handler için ayrı client
export { createServerClient } from "@supabase/ssr";
