import { CryptoCoin } from "../types";
import { getTicker24hr, symbolToBinancePair, tickerToCryptoCoin } from "../binance";
import { createAdminClient } from "./admin";
import { createClient } from "./client";

export interface SwingIndicators {
  id: string;
  coin_id: string;
  coin_symbol: string;
  ma: number | null;
  ma50: number | null;
  ma100: number | null;
  ma200: number | null;
  atr: number | null;
  fib_value: number | null;
  fib_trend: string | null;
  fib_start_price: number | null;
  fib_end_price: number | null;
  rsi: number | null;
  adx: number | null;
  updated_at: string;
  created_at: string;
}

export interface ScalpIndicators {
  id: string;
  coin_id: string;
  coin_symbol: string;
  atr: number | null;
  vwap: number | null;
  bbands_upper: number | null;
  bbands_middle: number | null;
  bbands_lower: number | null;
  pivot_r3: number | null;
  pivot_r2: number | null;
  pivot_r1: number | null;
  pivot_p: number | null;
  pivot_s1: number | null;
  pivot_s2: number | null;
  pivot_s3: number | null;
  rsi: number | null;
  updated_at: string;
  created_at: string;
}

/**
 * Cache'in yaşını kontrol et (1 dakikadan eski mi?)
 */
export function isCacheFresh(updatedAt: string): boolean {
  const updated = new Date(updatedAt).getTime();
  const now = Date.now();
  const oneMinute = 60 * 1000; // 1 dakika milisaniye cinsinden
  return (now - updated) < oneMinute;
}

/**
 * Cache'den swing göstergelerini getir
 */
export async function getSwingIndicatorsFromCache(
  coinId: string
): Promise<SwingIndicators | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("swing_indicators")
      .select("*")
      .eq("coin_id", coinId)
      .single();

    if (error) {
      console.error("Error fetching swing indicators from cache:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getSwingIndicatorsFromCache:", error);
    return null;
  }
}

/**
 * Cache'den scalp göstergelerini getir
 */
export async function getScalpIndicatorsFromCache(
  coinId: string
): Promise<ScalpIndicators | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("scalp_indicators")
      .select("*")
      .eq("coin_id", coinId)
      .single();

    if (error) {
      console.error("Error fetching scalp indicators from cache:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getScalpIndicatorsFromCache:", error);
    return null;
  }
}

/**
 * Cache'den göstergeleri getir (strategy'ye göre)
 */
export async function getIndicatorsFromCache(
  coinId: string,
  strategy: "swing" | "scalp"
): Promise<{ data: SwingIndicators | ScalpIndicators | null; is_fresh: boolean }> {
  if (strategy === "swing") {
    const data = await getSwingIndicatorsFromCache(coinId);
    if (!data) {
      return { data: null, is_fresh: false };
    }
    return { data, is_fresh: isCacheFresh(data.updated_at) };
  } else {
    const data = await getScalpIndicatorsFromCache(coinId);
    if (!data) {
      return { data: null, is_fresh: false };
    }
    return { data, is_fresh: isCacheFresh(data.updated_at) };
  }
}

/**
 * Veritabanında indicators'ı olan tüm coinleri getir
 */
export async function getAllCoinsWithIndicators(
  strategy: "swing" | "scalp"
): Promise<Array<{ coin_id: string; coin_symbol: string }>> {
  try {
    const supabase = createAdminClient();
    const tableName = strategy === "swing" ? "swing_indicators" : "scalp_indicators";
    
    const { data, error } = await supabase
      .from(tableName)
      .select("coin_id, coin_symbol")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(`Error fetching coins from ${tableName}:`, error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAllCoinsWithIndicators:", error);
    return [];
  }
}

/**
 * Symbol'e göre swing göstergelerini getir
 */
export async function getSwingIndicatorsBySymbol(
  coinSymbol: string
): Promise<SwingIndicators | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("swing_indicators")
      .select("*")
      .eq("coin_symbol", coinSymbol.toUpperCase())
      .single();

    if (error) {
      console.error("Error fetching swing indicators by symbol:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getSwingIndicatorsBySymbol:", error);
    return null;
  }
}

/**
 * Symbol'e göre scalp göstergelerini getir
 */
export async function getScalpIndicatorsBySymbol(
  coinSymbol: string
): Promise<ScalpIndicators | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("scalp_indicators")
      .select("*")
      .eq("coin_symbol", coinSymbol.toUpperCase())
      .single();

    if (error) {
      console.error("Error fetching scalp indicators by symbol:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getScalpIndicatorsBySymbol:", error);
    return null;
  }
}

export async function getCoinsWithSwingIndicators(): Promise<Array<{
  coin: CryptoCoin;
  indicators: SwingIndicators;
}>> {
  try {
    // API/Server ortamında admin client kullan
    const supabase = createAdminClient();
    
    console.log("[Indicators] Supabase'den veri çekme denemesi...");
    
    // 1. Önce sadece veriyi çekmeyi deneyelim (order olmadan, en yalın haliyle)
    const { data, error, count } = await supabase
      .from("swing_indicators")
      .select("*", { count: "exact" });

    if (error) {
      console.error("[Indicators] Supabase Select Hatası:", error.message, error.details);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn(`[Indicators] Veritabanında ${count || 0} satır görüldü ama veriler okunamadı (RLS engeli olabilir).`);
      return [];
    }

    console.log(`[Indicators] ${data.length} adet veri başarıyla okundu. Binance fiyatları kontrol ediliyor...`);

    // Fetch current prices from Binance for all coins
    const results = await Promise.all(
      data.map(async (item, index) => {
        try {
          const binanceSymbol = symbolToBinancePair(item.coin_symbol);
          // Binance'den fiyat almayı deneyelim
          const ticker = await getTicker24hr(binanceSymbol).catch(() => null);
          
          if (ticker) {
            return {
              coin: tickerToCryptoCoin(ticker, index + 1),
              indicators: item
            };
          }
          
          // Binance başarısızsa fallback (ma değerini fiyat kabul et)
          const fallbackCoin: CryptoCoin = {
            id: item.coin_id,
            symbol: item.coin_symbol.toLowerCase(),
            name: item.coin_symbol.toUpperCase(),
            image: "",
            current_price: item.ma || 0,
            market_cap: 0,
            market_cap_rank: index + 1,
            price_change_percentage_24h: 0,
            total_volume: 0,
            high_24h: 0,
            low_24h: 0,
            circulating_supply: 0,
            total_supply: 0,
            last_updated: new Date().toISOString(),
            price_change_24h: 0,
            ath: 0,
            ath_change_percentage: 0,
            ath_date: "",
            atl: 0,
            atl_change_percentage: 0,
            atl_date: ""
          };

          return { coin: fallbackCoin, indicators: item };
        } catch (err) {
          return null;
        }
      })
    );

    return results.filter((r): r is { coin: CryptoCoin; indicators: SwingIndicators } => r !== null);
  } catch (error) {
    console.error("[Indicators] getCoinsWithSwingIndicators hatası:", error);
    return [];
  }
}
