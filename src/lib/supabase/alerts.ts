import { createClient } from "./client";
import { SignalChange } from "./signals";
import { SignalResult } from "../signal-engine";
import { sendSignalEmail } from "../resend";

/**
 * Alert sistemi için hazırlık fonksiyonları
 */

export interface SignalAlert {
  id: string;
  user_id: string;
  coin_symbol: string;
  change_type: string;
  old_score?: number;
  new_score: number;
  old_decision?: string;
  new_decision: string;
  crossed_threshold?: string;
  sent_at?: string;
  created_at: string;
}

/**
 * Alert tetikleme koşullarını kontrol et
 */
export function shouldTriggerAlert(change: SignalChange): boolean {
  // 1. Yeni bir coin analizi (ilk defa kayıt ediliyorsa)
  if (change.change_type === "NEW_SIGNAL") {
    // Sadece LONG veya SHORT ise mail gönder
    return change.new_decision === "LONG" || change.new_decision === "SHORT";
  }

  // 2. Karar değiştiyse (Örn: WAIT -> LONG, SHORT -> LONG, LONG -> SHORT vb.)
  if (change.change_type === "DECISION_CHANGE") {
    // Sadece LONG veya SHORT'a geçişlerde mail gönder
    // Karar WAIT'e döndüyse (işlemden çıkış) mail göndermiyoruz
    return change.new_decision === "LONG" || change.new_decision === "SHORT";
  }

  // 3. Eğer karar değişmediyse (örn: zaten LONG idi ve hala LONG)
  // Skor artsa veya ACTION eşiğini geçse bile e-posta göndermiyoruz.
  // Bu sayede aynı sinyal için defalarca mail gitmesi engellenir.
  
  return false;
}

/**
 * Alert'i kuyruğa ekle ve bildirimleri açık tüm kullanıcılara email gönder
 */
export async function queueAlert(
  change: SignalChange,
  signal: SignalResult
): Promise<boolean> {
  try {
    const alertTetiklendi = shouldTriggerAlert(change);
    
    console.log(`[Alert Queue] Signal: ${change.coin_symbol}, Change: ${change.change_type}, Triggered: ${alertTetiklendi}`);
    
    if (alertTetiklendi) {
      const supabase = createClient();
      
      // 🚀 Email bildirimleri açık olan tüm kullanıcıları getir (RPC fonksiyonu ile RLS bypass edilir)
      const { data: subscribers, error: subError } = await supabase
        .rpc("get_email_subscribers");
        
      if (subError) {
        console.error("Error fetching email subscribers via RPC:", subError);
        return false;
      }

      if (!subscribers || subscribers.length === 0) {
        console.log("[Alert] Email gönderilecek abone bulunamadı.");
        return true;
      }

      // Email adreslerini ayıkla
      const emails = subscribers
        .map((s: { email: string }) => s.email)
        .filter((email: string | undefined) => !!email);

      if (emails.length === 0) {
        console.log("[Alert] Geçerli email adresi bulunamadı.");
        return true;
      }

      console.log(`[Alert] ${emails.length} kullanıcıya email gönderiliyor: ${change.coin_symbol} -> ${signal.decision}`);
      
      // Resend API ile toplu gönderim yap (Resend to alanında array destekler)
      await sendSignalEmail(
        emails,
        signal.coin.symbol.toUpperCase(),
        signal.decision,
        signal.score,
        signal.coin.current_price,
        signal.justification
      );
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error queueing alert:", error);
    return false;
  }
}

/**
 * Bekleyen alert'leri getir (gelecekte implement edilecek)
 */
export async function getPendingAlerts(): Promise<SignalAlert[]> {
  try {
    return [];
  } catch (error) {
    console.error("Error fetching pending alerts:", error);
    return [];
  }
}

/**
 * Alert gönderildi olarak işaretle (gelecekte implement edilecek)
 */
export async function markAlertAsSent(): Promise<boolean> {
  try {
    return true;
  } catch (error) {
    console.error("Error marking alert as sent:", error);
    return false;
  }
}
