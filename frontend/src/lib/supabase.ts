import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Auto-detect session from URL (for both implicit and PKCE flows)
    detectSessionInUrl: true,
    // This app stores auth state in Zustand; avoid duplicate long-lived token storage.
    persistSession: false,
    flowType: "implicit",
  },
});
