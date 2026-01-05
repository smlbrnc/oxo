import { createClient } from "@supabase/supabase-js";

/**
 * Arka plan işlemleri (Cron vb.) için RLS'yi bypass eden admin istemcisi.
 * Bu istemci SERVICE_ROLE_KEY kullanır ve tüm yetkilere sahiptir.
 * ÖNEMLİ: Bu istemciyi asla client-side (tarayıcı) tarafında kullanmayın!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Vercel'de SUPABASE_SERVICE_ROLE_KEY olarak tanımlanmalıdır.
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase URL veya Key bulunamadı.");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
