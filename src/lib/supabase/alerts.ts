import { createClient } from "./client";
import { SignalChange } from "./signals";

/**
 * Alert sistemi için hazırlık fonksiyonları
 * Gelecekte signal_alerts tablosu ve alert gönderme mekanizması eklenecek
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
  // Score >= 80 olan yeni signal'lar
  if (change.change_type === "NEW_SIGNAL" && change.new_score >= 80) {
    return true;
  }

  // Decision değişti (WAIT → LONG/SHORT)
  if (change.change_type === "DECISION_CHANGE") {
    return change.new_decision !== "WAIT";
  }

  // Eşik geçişleri
  if (change.crossed_threshold) {
    return true;
  }

  // Score 0-54 → 55+ (WATCHLIST'e geçti)
  if (
    change.change_type === "SCORE_INCREASE" &&
    change.old_score !== undefined &&
    change.old_score < 55 &&
    change.new_score >= 55
  ) {
    return true;
  }

  // Score 55-79 → 80+ (ACTION'a geçti)
  if (
    change.change_type === "SCORE_INCREASE" &&
    change.old_score !== undefined &&
    change.old_score >= 55 &&
    change.old_score < 80 &&
    change.new_score >= 80
  ) {
    return true;
  }

  return false;
}

/**
 * Alert'i kuyruğa ekle (gelecekte implement edilecek)
 */
export async function queueAlert(
  userId: string,
  change: SignalChange
): Promise<boolean> {
  try {
    // TODO: signal_alerts tablosu oluşturulduğunda implement edilecek
    // Şimdilik sadece log
    console.log(`[Alert Queue] User ${userId}, Coin ${change.coin_symbol}, Change: ${change.change_type}`);
    
    if (shouldTriggerAlert(change)) {
      console.log(`[Alert Queue] Alert tetiklendi: ${change.coin_symbol} - ${change.change_type}`);
      // Gelecekte: Supabase'e kaydet
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
export async function getPendingAlerts(userId: string): Promise<SignalAlert[]> {
  try {
    // TODO: signal_alerts tablosundan bekleyen alert'leri getir
    return [];
  } catch (error) {
    console.error("Error fetching pending alerts:", error);
    return [];
  }
}

/**
 * Alert gönderildi olarak işaretle (gelecekte implement edilecek)
 */
export async function markAlertAsSent(alertId: string): Promise<boolean> {
  try {
    // TODO: signal_alerts tablosunda sent_at güncelle
    return true;
  } catch (error) {
    console.error("Error marking alert as sent:", error);
    return false;
  }
}
