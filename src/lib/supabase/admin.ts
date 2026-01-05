import { createClient } from "@supabase/supabase-js";

/**
 * Arka plan işlemleri (Cron vb.) için RLS'yi bypass eden admin istemcisi.
 * Bu istemci SERVICE_ROLE_KEY kullanır ve tüm yetkilere sahiptir.
 * ÖNEMLİ: Bu istemciyi asla client-side (tarayıcı) tarafında kullanmayın!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL eksik.");
  }

  if (!supabaseServiceKey) {
    // Admin yetkisi yoksa Anon key ile dene ama uyar
    console.warn("[Admin] SUPABASE_SERVICE_ROLE_KEY bulunamadı, kısıtlı yetkiyle çalışılıyor.");
    return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
