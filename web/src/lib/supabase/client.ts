"use client";
import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (typeof window === "undefined") return null as unknown as ReturnType<typeof createBrowserClient>;
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("[Supabase] Missing env vars:", { url: !!url, key: !!key });
    return null as unknown as ReturnType<typeof createBrowserClient>;
  }
  try {
    client = createBrowserClient(url, key);
  } catch (e) {
    console.error("[Supabase] createBrowserClient failed:", e);
    return null as unknown as ReturnType<typeof createBrowserClient>;
  }
  return client;
}
