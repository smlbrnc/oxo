import { createClient } from "./client";
import { CryptoCoin } from "../types";
import { getTicker24hr, symbolToBinancePair, tickerToCryptoCoin } from "../binance";

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
    const supabase = createClient();
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
    const supabase = createClient();
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
    const supabase = createClient();
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

/**
 * Swing indicators ile birlikte coin verilerini getir
 * Her coin için güncel fiyat bilgisi Binance'den alınır
 */
export async function getCoinsWithSwingIndicators(): Promise<Array<{
  coin: CryptoCoin;
  indicators: SwingIndicators;
}>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("swing_indicators")
      .select("*")
      .order("coin_symbol", { ascending: true });

    if (error) {
      console.error("Error fetching swing indicators from Supabase:", error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log("[Indicators] Supabase swing_indicators tablosu boş döndü.");
      return [];
    }

    console.log(`[Indicators] Supabase'den ${data.length} adet indicator verisi alındı. Binance fiyatları çekiliyor...`);

    // Fetch current prices from Binance for all coins
    const tickers = await Promise.all(
      data.map(async (item) => {
        try {
          const binanceSymbol = symbolToBinancePair(item.coin_symbol);
          const ticker = await getTicker24hr(binanceSymbol);
          if (!ticker) {
            console.warn(`[Indicators] ${item.coin_symbol} için Binance ticker alınamadı.`);
          }
          return ticker;
        } catch (err) {
          console.error(`[Indicators] ${item.coin_symbol} için Binance hatası:`, err);
          return null;
        }
      })
    );

    // Map tickers to coins with indicators
    const results = tickers
      .map((ticker, index) => {
        if (!ticker) return null;
        
        const coin = tickerToCryptoCoin(ticker, index + 1);
        const indicators = data[index];
        
        return { coin, indicators };
      })
      .filter((item): item is { coin: CryptoCoin; indicators: SwingIndicators } => item !== null);

    console.log(`[Indicators] Toplam ${results.length} coin başarıyla hazırlandı.`);
    return results;
  } catch (error) {
    console.error("Error in getCoinsWithSwingIndicators:", error);
    return [];
  }
}
