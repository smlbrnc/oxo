import { createClient } from "./client";
import { SignalResult } from "../signal-engine";
import { CryptoCoin } from "../types";

export interface StoredSignal {
  id: string;
  coin_id: string;
  coin_symbol: string;
  decision: "LONG" | "SHORT" | "WAIT";
  score: number;
  show_in_ui: boolean;
  
  // Trend data
  trend_context: string;
  trend_points: number;
  trend_adx: number;
  trend_adx_strength: string;
  trend_ma_structure: string;
  
  // Momentum data
  momentum_points: number;
  momentum_rsi: number;
  momentum_zone: string;
  momentum_status: string;
  
  // Structure data
  structure_points: number;
  structure_fib_check: string;
  structure_fib_value: number;
  structure_distance: number;
  structure_distance_in_atr: number;
  
  // Risk data
  risk_points: number;
  risk_atr_percent: number;
  risk_assessment: string;
  risk_stop_loss_risk: number;
  
  // Metadata
  justification: string;
  price: number;
  calculated_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Signal'ı veritabanına kaydet
 */
export async function saveSignal(signal: SignalResult): Promise<StoredSignal | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("signals")
      .insert({
        coin_id: signal.coin.id,
        coin_symbol: signal.coin.symbol.toUpperCase(),
        decision: signal.decision,
        score: signal.score,
        show_in_ui: signal.showInUI,
        
        // Trend data
        trend_context: signal.trend.context,
        trend_points: signal.trend.points,
        trend_adx: signal.trend.adx,
        trend_adx_strength: signal.trend.adxStrength,
        trend_ma_structure: signal.trend.maStructure,
        
        // Momentum data
        momentum_points: signal.momentum.points,
        momentum_rsi: signal.momentum.rsi,
        momentum_zone: signal.momentum.zone,
        momentum_status: signal.momentum.status,
        
        // Structure data
        structure_points: signal.structure.points,
        structure_fib_check: signal.structure.fibCheck,
        structure_fib_value: signal.structure.fibValue,
        structure_distance: signal.structure.distance,
        structure_distance_in_atr: signal.structure.distanceInATR,
        
        // Risk data
        risk_points: signal.risk.points,
        risk_atr_percent: signal.risk.atrPercent,
        risk_assessment: signal.risk.assessment,
        risk_stop_loss_risk: signal.risk.stopLossRisk,
        
        // Metadata
        justification: signal.justification,
        price: signal.coin.current_price,
        calculated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving signal:", error);
      return null;
    }

    return data as StoredSignal;
  } catch (error) {
    console.error("Error in saveSignal:", error);
    return null;
  }
}

/**
 * En son hesaplanmış signal'ı getir
 */
export async function getLatestSignal(coinSymbol: string): Promise<StoredSignal | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("signals")
      .select("*")
      .eq("coin_symbol", coinSymbol.toUpperCase())
      .order("calculated_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      console.error("Error fetching latest signal:", error);
      return null;
    }

    return data as StoredSignal;
  } catch (error) {
    console.error("Error in getLatestSignal:", error);
    return null;
  }
}

/**
 * Belirli skor üstündeki signal'ları getir
 */
export async function getSignalsByScore(
  minScore: number = 55,
  limit: number = 100
): Promise<StoredSignal[]> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("signals")
      .select("*")
      .gte("score", minScore)
      .eq("show_in_ui", true)
      .order("calculated_at", { ascending: false })
      .order("score", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching signals by score:", error);
      return [];
    }

    // Her coin için en son signal'ı al
    const latestSignals = new Map<string, StoredSignal>();
    
    for (const signal of (data || [])) {
      const existing = latestSignals.get(signal.coin_symbol);
      if (!existing || new Date(signal.calculated_at) > new Date(existing.calculated_at)) {
        latestSignals.set(signal.coin_symbol, signal as StoredSignal);
      }
    }

    return Array.from(latestSignals.values())
      .sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("Error in getSignalsByScore:", error);
    return [];
  }
}

/**
 * Tüm coinler için en son signal'ları getir
 */
export async function getAllLatestSignals(): Promise<StoredSignal[]> {
  try {
    const supabase = createClient();
    
    // Her coin için en son signal'ı almak için subquery kullan
    const { data, error } = await supabase
      .from("signals")
      .select("*")
      .order("calculated_at", { ascending: false });

    if (error) {
      console.error("Error fetching all latest signals:", error);
      return [];
    }

    // Her coin için en son signal'ı al
    const latestSignals = new Map<string, StoredSignal>();
    
    for (const signal of (data || [])) {
      const existing = latestSignals.get(signal.coin_symbol);
      if (!existing || new Date(signal.calculated_at) > new Date(existing.calculated_at)) {
        latestSignals.set(signal.coin_symbol, signal as StoredSignal);
      }
    }

    return Array.from(latestSignals.values())
      .filter((s) => s.show_in_ui) // Sadece UI'da gösterilecek olanlar
      .sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("Error in getAllLatestSignals:", error);
    return [];
  }
}

/**
 * Signal değişikliklerini tespit et
 */
export interface SignalChange {
  coin_symbol: string;
  change_type: "SCORE_INCREASE" | "SCORE_DECREASE" | "DECISION_CHANGE" | "NEW_SIGNAL" | "NO_CHANGE";
  old_score?: number;
  new_score: number;
  old_decision?: "LONG" | "SHORT" | "WAIT";
  new_decision: "LONG" | "SHORT" | "WAIT";
  crossed_threshold?: "WATCHLIST" | "ACTION";
}

export function compareSignals(
  oldSignal: StoredSignal | null,
  newSignal: SignalResult
): SignalChange | null {
  if (!oldSignal) {
    // Yeni signal
    return {
      coin_symbol: newSignal.coin.symbol.toUpperCase(),
      change_type: "NEW_SIGNAL",
      new_score: newSignal.score,
      new_decision: newSignal.decision,
      crossed_threshold: newSignal.score >= 80 ? "ACTION" : newSignal.score >= 55 ? "WATCHLIST" : undefined,
    };
  }

  // Decision değişti mi?
  if (oldSignal.decision !== newSignal.decision) {
    return {
      coin_symbol: newSignal.coin.symbol.toUpperCase(),
      change_type: "DECISION_CHANGE",
      old_decision: oldSignal.decision,
      new_decision: newSignal.decision,
      old_score: oldSignal.score,
      new_score: newSignal.score,
    };
  }

  // Skor eşiklerini geçti mi?
  const oldThreshold = oldSignal.score >= 80 ? "ACTION" : oldSignal.score >= 55 ? "WATCHLIST" : null;
  const newThreshold = newSignal.score >= 80 ? "ACTION" : newSignal.score >= 55 ? "WATCHLIST" : null;
  
  if (oldThreshold !== newThreshold && newThreshold) {
    return {
      coin_symbol: newSignal.coin.symbol.toUpperCase(),
      change_type: "SCORE_INCREASE",
      old_score: oldSignal.score,
      new_score: newSignal.score,
      new_decision: newSignal.decision,
      crossed_threshold: newThreshold,
    };
  }

  // Skor değişti mi?
  if (oldSignal.score !== newSignal.score) {
    return {
      coin_symbol: newSignal.coin.symbol.toUpperCase(),
      change_type: newSignal.score > oldSignal.score ? "SCORE_INCREASE" : "SCORE_DECREASE",
      old_score: oldSignal.score,
      new_score: newSignal.score,
      new_decision: newSignal.decision,
    };
  }

  // Değişiklik yok
  return {
    coin_symbol: newSignal.coin.symbol.toUpperCase(),
    change_type: "NO_CHANGE",
    new_score: newSignal.score,
    new_decision: newSignal.decision,
  };
}

/**
 * StoredSignal'ı SignalResult'a dönüştür
 */
export function storedSignalToSignalResult(stored: StoredSignal, coin: CryptoCoin): SignalResult {
  return {
    coin: {
      ...coin,
      current_price: stored.price,
    },
    decision: stored.decision,
    score: stored.score,
    showInUI: stored.show_in_ui,
    trend: {
      context: stored.trend_context as "BULLISH" | "BEARISH" | "NEUTRAL",
      points: stored.trend_points,
      adx: stored.trend_adx,
      adxStrength: stored.trend_adx_strength as "STRONG" | "MODERATE" | "WEAK",
      maStructure: stored.trend_ma_structure as "PERFECT" | "PARTIAL" | "MESSY",
      priceVsMA100: "AT" as const, // Bu bilgi stored'da yok, default değer
    },
    momentum: {
      points: stored.momentum_points,
      rsi: stored.momentum_rsi,
      zone: stored.momentum_zone as "HEALTHY" | "STRONG" | "OVERBOUGHT" | "OVERSOLD" | "WEAK",
      status: stored.momentum_status,
    },
    structure: {
      points: stored.structure_points,
      fibCheck: stored.structure_fib_check as "VALID_SAFE" | "VALID_FRAGILE" | "INVALID",
      fibValue: stored.structure_fib_value,
      distance: stored.structure_distance,
      distanceInATR: stored.structure_distance_in_atr,
    },
    risk: {
      points: stored.risk_points,
      atrPercent: stored.risk_atr_percent,
      assessment: stored.risk_assessment as "SAFE" | "ELEVATED" | "EXTREME",
      stopLossRisk: stored.risk_stop_loss_risk,
    },
    justification: stored.justification,
  };
}
