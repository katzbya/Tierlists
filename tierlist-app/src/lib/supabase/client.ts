import { createBrowserClient } from "@supabase/ssr";

// Validate URL so a placeholder in .env.local doesn't crash the build.
function validUrl(v: string | undefined) {
  try { new URL(v!); return v!; } catch { return "https://placeholder.supabase.co"; }
}
const SUPABASE_URL = validUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith("your")
  ? "placeholder"
  : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder");

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
