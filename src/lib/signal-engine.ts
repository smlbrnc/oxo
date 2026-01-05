import { CryptoCoin } from "./types";
import { SwingIndicators } from "./supabase/indicators";
import { SignalConfig, DEFAULT_SIGNAL_CONFIG } from "./signal-config";

export interface SignalResult {
  coin: CryptoCoin;
  decision: "LONG" | "SHORT" | "WAIT";
  score: number;
  showInUI: boolean;
  
  trend: {
    context: "BULLISH" | "BEARISH" | "NEUTRAL";
    points: number;
    adx: number;
    adxStrength: "STRONG" | "MODERATE" | "WEAK";
    maStructure: "PERFECT" | "PARTIAL" | "MESSY";
    priceVsMA100: "ABOVE" | "BELOW" | "AT";
  };
  
  momentum: {
    points: number;
    rsi: number;
    zone: "HEALTHY" | "STRONG" | "OVERBOUGHT" | "OVERSOLD" | "WEAK";
    status: string;
  };
  
  structure: {
    points: number;
    fibCheck: "VALID_SAFE" | "VALID_FRAGILE" | "INVALID";
    fibValue: number;
    distance: number;
    distanceInATR: number;
  };
  
  risk: {
    points: number;
    atrPercent: number;
    assessment: "SAFE" | "ELEVATED" | "EXTREME";
    stopLossRisk: number;
  };
  
  // İşlem seviyeleri (sadece LONG veya SHORT kararlarında)
  tradeLevels?: {
    entryPrice: number;      // Giriş fiyatı (mevcut fiyat)
    takeProfit: number;       // Kâr al seviyesi
    stopLoss: number;         // Zarar durdur seviyesi
  };
  
  justification: string;
}

// ============================================
// STEP 1: TREND IDENTIFICATION
// ============================================
interface TrendResult {
  context: "BULLISH" | "BEARISH" | "NEUTRAL";
  pass: boolean;
  points: number;
  adx: number;
  adxStrength: "STRONG" | "MODERATE" | "WEAK";
  maStructure: "PERFECT" | "PARTIAL" | "MESSY";
  priceVsMA100: "ABOVE" | "BELOW" | "AT";
}

function evaluateTrend(indicators: SwingIndicators, price: number, config: SignalConfig): TrendResult {
  const { ma50, ma100, ma200, adx, fib_value } = indicators;
  const { trend: trendCfg, weights } = config;
  
  if (!ma50 || !ma100 || !ma200 || !adx) {
    return {
      context: "NEUTRAL" as const,
      pass: false,
      points: 0,
      adx: adx || 0,
      adxStrength: "WEAK" as const,
      maStructure: "MESSY" as const,
      priceVsMA100: (price > (ma100 || 0) ? "ABOVE" : "BELOW") as "ABOVE" | "BELOW" | "AT",
    };
  }
  
  if (adx < trendCfg.adxMinimum) {
    return {
      context: "NEUTRAL" as const,
      pass: false,
      points: 0,
      adx: adx,
      adxStrength: "WEAK" as const,
      maStructure: "MESSY" as const,
      priceVsMA100: (price > ma100 ? "ABOVE" : "BELOW") as "ABOVE" | "BELOW" | "AT",
    };
  }
  
  const perfectBullishAlignment = ma50 > ma100 && ma100 > ma200;
  const priceAboveMA50 = price > ma50;
  const priceAboveMA100 = price > ma100;
  const priceAboveMA200 = price > ma200;
  const priceAboveFib = fib_value ? price > fib_value : false;

  const perfectBearishAlignment = ma50 < ma100 && ma100 < ma200;
  const priceBelowMA50 = price < ma50;
  const priceBelowMA100 = price < ma100;
  const priceBelowMA200 = price < ma200;
  const priceBelowFib = fib_value ? price < fib_value : false;

  // 1. BULLISH
  if (perfectBullishAlignment && priceAboveMA100) {
    let pts = Math.round(weights.trend * 0.75);
    if (adx >= trendCfg.adxStrong) pts = weights.trend;
    else if (adx > trendCfg.adxMinimum) {
      pts = pts + Math.round(((adx - trendCfg.adxMinimum) / (trendCfg.adxStrong - trendCfg.adxMinimum)) * (weights.trend - pts));
    }
    
    return {
      context: "BULLISH" as const,
      pass: true,
      points: pts,
      adx: adx,
      adxStrength: (adx >= trendCfg.adxStrong ? "STRONG" : "MODERATE") as "STRONG" | "MODERATE" | "WEAK",
      maStructure: "PERFECT" as const,
      priceVsMA100: "ABOVE" as const,
    };
  }

  const bullishReversal = trendCfg.maPhaseLagGevşetme && priceAboveMA50 && priceAboveFib && adx >= trendCfg.adxMinimum;
  const partialBullish1 = ma50 > ma100 && priceAboveMA100; 
  const partialBullish2 = ma50 > ma200 && priceAboveMA50;  
  const earlyBullish = priceAboveMA200 && adx >= 30;

  if ((bullishReversal || partialBullish1 || partialBullish2 || earlyBullish) && !perfectBullishAlignment) {
    let basePts = Math.round(weights.trend * 0.4);
    if (adx >= trendCfg.adxStrong) basePts = Math.round(weights.trend * 0.65);
    
    let bonus = 0;
    if (priceAboveMA200) bonus += 5;
    if (priceAboveFib) bonus += 5;
    if (ma50 > ma100) bonus += 3;
    
    return {
      context: "BULLISH" as const,
      pass: true,
      points: Math.min(weights.trend - 2, basePts + bonus),
      adx: adx,
      adxStrength: (adx >= trendCfg.adxStrong ? "STRONG" : "MODERATE") as "STRONG" | "MODERATE" | "WEAK",
      maStructure: "PARTIAL" as const,
      priceVsMA100: (priceAboveMA100 ? "ABOVE" : "BELOW") as "ABOVE" | "BELOW" | "AT",
    };
  }

  // 2. BEARISH
  if (perfectBearishAlignment && priceBelowMA100) {
    let pts = Math.round(weights.trend * 0.75);
    if (adx >= trendCfg.adxStrong) pts = weights.trend;
    else if (adx > trendCfg.adxMinimum) {
      pts = pts + Math.round(((adx - trendCfg.adxMinimum) / (trendCfg.adxStrong - trendCfg.adxMinimum)) * (weights.trend - pts));
    }
    
    return {
      context: "BEARISH" as const,
      pass: true,
      points: pts,
      adx: adx,
      adxStrength: (adx >= trendCfg.adxStrong ? "STRONG" : "MODERATE") as "STRONG" | "MODERATE" | "WEAK",
      maStructure: "PERFECT" as const,
      priceVsMA100: "BELOW" as const,
    };
  }

  const bearishReversal = trendCfg.maPhaseLagGevşetme && priceBelowMA50 && priceBelowFib && adx >= trendCfg.adxMinimum;
  const partialBearish1 = ma50 < ma100 && priceBelowMA100;
  const partialBearish2 = ma50 < ma200 && priceBelowMA50;
  const earlyBearish = priceBelowMA200 && adx >= 30;

  if ((bearishReversal || partialBearish1 || partialBearish2 || earlyBearish) && !perfectBearishAlignment) {
    let basePts = Math.round(weights.trend * 0.4);
    if (adx >= trendCfg.adxStrong) basePts = Math.round(weights.trend * 0.65);
    
    let bonus = 0;
    if (priceBelowMA200) bonus += 5;
    if (priceBelowFib) bonus += 5;
    if (ma50 < ma100) bonus += 3;
    
    return {
      context: "BEARISH" as const,
      pass: true,
      points: Math.min(weights.trend - 2, basePts + bonus),
      adx: adx,
      adxStrength: (adx >= trendCfg.adxStrong ? "STRONG" : "MODERATE") as "STRONG" | "MODERATE" | "WEAK",
      maStructure: "PARTIAL" as const,
      priceVsMA100: (priceBelowMA100 ? "BELOW" : "ABOVE") as "ABOVE" | "BELOW" | "AT",
    };
  }

  return { context: "NEUTRAL" as const, pass: false, points: 0, adx: adx || 0, adxStrength: "WEAK" as const, maStructure: "MESSY" as const, priceVsMA100: "AT" as const };
}

// ============================================
// STEP 2: MOMENTUM CONTROL (RSI)
// ============================================
interface MomentumResult {
  points: number;
  zone: "HEALTHY" | "STRONG" | "OVERBOUGHT" | "OVERSOLD" | "WEAK";
  status: string;
}

function evaluateMomentum(rsi: number | null, context: "BULLISH" | "BEARISH" | "NEUTRAL", adx: number, config: SignalConfig): MomentumResult {
  const { weights } = config;
  if (context === "NEUTRAL" || rsi === null) return { points: 0, zone: "WEAK" as const, status: "Geçerli trend yok" };
  
  const isStrongTrend = adx >= 35;

  if (context === "BULLISH") {
    if (rsi >= 40 && rsi <= 60) return { points: weights.momentum, zone: "HEALTHY" as const, status: "Sağlıklı yükseliş momentumu" };
    
    if (rsi > 60) {
      if (isStrongTrend) {
        const pts = Math.round(weights.momentum * 0.9); 
        return { points: pts, zone: "STRONG" as const, status: "Güçlü trend momentumu" };
      }
      const pts = Math.round(weights.momentum * 0.8) - Math.round((rsi - 60) * 1);
      return { points: Math.max(5, pts), zone: (rsi > 70 ? "OVERBOUGHT" : "STRONG") as "OVERBOUGHT" | "STRONG", status: rsi > 70 ? "Aşırı alım uyarısı" : "Güçlü yükseliş" };
    }
    return { points: 0, zone: "WEAK" as const, status: "Zayıf momentum" };
  }
  
  // BEARISH
  if (rsi >= 40 && rsi <= 60) return { points: weights.momentum, zone: "HEALTHY" as const, status: "Sağlıklı düşüş momentumu" };
  if (rsi < 40) {
    if (isStrongTrend) {
      const pts = Math.round(weights.momentum * 0.9);
      return { points: pts, zone: "STRONG" as const, status: "Güçlü düşüş momentumu" };
    }
    const pts = Math.round(weights.momentum * 0.8) - Math.round((40 - rsi) * 1);
    return { points: Math.max(5, pts), zone: (rsi < 30 ? "OVERSOLD" : "STRONG") as "OVERSOLD" | "STRONG", status: rsi < 30 ? "Aşırı satım uyarısı" : "Güçlü düşüş" };
  }
  if (rsi > 60) {
    const pts = Math.max(0, Math.round(weights.momentum * 0.4) - Math.round((rsi - 60) * 1));
    return { points: pts, zone: "WEAK" as const, status: "Zayıf momentum (RSI yüksek)" };
  }
  return { points: 0, zone: "WEAK" as const, status: "Zayıf momentum" };
}

// ============================================
// STEP 3: STRUCTURE VALIDATION
// ============================================
interface StructureResult {
  points: number;
  fibCheck: "VALID_SAFE" | "VALID_FRAGILE" | "INVALID";
  distance: number;
  distanceInATR: number;
  forceWait: boolean;
}

function evaluateStructure(
  price: number, fib618: number | null, fibEnd: number | null, fibStart: number | null, 
  atr: number | null, context: "BULLISH" | "BEARISH" | "NEUTRAL", config: SignalConfig
): StructureResult {
  const { structure: structCfg, weights } = config;
  if (context === "NEUTRAL" || fib618 === null || atr === null || atr === 0) return { points: 0, fibCheck: "INVALID" as const, distance: 0, distanceInATR: 0, forceWait: false };
  
  const distance = Math.abs(price - fib618);
  const distanceInATR = distance / atr;
  
  if (context === "BULLISH") {
    if (price < fib618) {
      if (distanceInATR <= structCfg.fibToleranceATR) {
        const pts = Math.round(weights.structure * (0.5 * (1 - distanceInATR/structCfg.fibToleranceATR)));
        return { points: Math.max(0, pts), fibCheck: "INVALID" as const, distance, distanceInATR, forceWait: false };
      }
      return { points: 0, fibCheck: "INVALID" as const, distance, distanceInATR, forceWait: false };
    }
    if (structCfg.kademeliAzalma && fibEnd && price >= fib618) {
      if (price >= fibEnd) return { points: 0, fibCheck: "VALID_SAFE" as const, distance, distanceInATR, forceWait: false };
      const ratio = (price - fib618) / (fibEnd - fib618);
      const pts = Math.round(weights.structure * (1 - ratio));
      const forceWait = distanceInATR < structCfg.safeZoneATR;
      return { points: pts, fibCheck: (forceWait ? "VALID_FRAGILE" : "VALID_SAFE") as "VALID_FRAGILE" | "VALID_SAFE", distance, distanceInATR, forceWait };
    }
  } else {
    if (price > fib618) {
      if (distanceInATR <= structCfg.fibToleranceATR) {
        const pts = Math.round(weights.structure * (0.5 * (1 - distanceInATR/structCfg.fibToleranceATR)));
        return { points: Math.max(0, pts), fibCheck: "INVALID" as const, distance, distanceInATR, forceWait: false };
      }
      return { points: 0, fibCheck: "INVALID" as const, distance, distanceInATR, forceWait: false };
    }
    if (structCfg.kademeliAzalma && fibStart && price <= fib618) {
      if (price <= fibStart) return { points: 0, fibCheck: "VALID_SAFE" as const, distance, distanceInATR, forceWait: false };
      const ratio = (fib618 - price) / (fib618 - fibStart);
      const pts = Math.round(weights.structure * (1 - ratio));
      const forceWait = distanceInATR < structCfg.safeZoneATR;
      return { points: pts, fibCheck: (forceWait ? "VALID_FRAGILE" : "VALID_SAFE") as "VALID_FRAGILE" | "VALID_SAFE", distance, distanceInATR, forceWait };
    }
  }
  const forceWait = distanceInATR < structCfg.safeZoneATR;
  return { points: weights.structure, fibCheck: (forceWait ? "VALID_FRAGILE" : "VALID_SAFE") as "VALID_FRAGILE" | "VALID_SAFE", distance, distanceInATR, forceWait };
}

// ============================================
// STEP 4: RISK (ATR)
// ============================================
interface RiskResult {
  points: number;
  assessment: "SAFE" | "ELEVATED" | "EXTREME";
  atrPercent: number;
  stopLossRisk: number;
  forceWait: boolean;
}

function evaluateRisk(atr: number | null, price: number, config: SignalConfig): RiskResult {
  const { risk: riskCfg, weights } = config;
  if (atr === null || atr === 0 || price === 0) return { points: 0, assessment: "EXTREME" as const, atrPercent: 0, stopLossRisk: 0, forceWait: true };
  const vol = (atr / price) * 100;
  const sl = (atr * 2) / price * 100;
  if (vol > riskCfg.volatilityExtreme) return { points: 0, assessment: "EXTREME" as const, atrPercent: vol, stopLossRisk: sl, forceWait: sl > riskCfg.maxStopLoss };
  const pts = vol >= 2.5 ? Math.round(weights.risk * 0.5) : weights.risk;
  return { points: pts, assessment: (vol >= 2.5 ? "ELEVATED" : "SAFE") as "ELEVATED" | "SAFE", atrPercent: vol, stopLossRisk: sl, forceWait: false };
}

// ============================================
// FINAL DECISION
// ============================================
export function calculateSignal(indicators: SwingIndicators, coin: CryptoCoin, config: SignalConfig = DEFAULT_SIGNAL_CONFIG): SignalResult {
  const price = coin.current_price;
  if (!indicators.ma50 || !indicators.ma100 || !indicators.ma200 || !indicators.adx || !indicators.rsi || !indicators.atr || !indicators.fib_value) {
    return createEmptySignal(coin, indicators);
  }
  const trend = evaluateTrend(indicators, price, config);
  if (!trend.pass) return createEmptySignal(coin, indicators, trend);
  const momentum = evaluateMomentum(indicators.rsi, trend.context, indicators.adx, config);
  const structure = evaluateStructure(price, indicators.fib_value, indicators.fib_end_price, indicators.fib_start_price, indicators.atr, trend.context, config);
  const risk = evaluateRisk(indicators.atr, price, config);
  
  if (structure.forceWait || risk.forceWait) return createForceWaitSignal(coin, indicators, trend, momentum, structure, risk);
  
  const totalScore = Math.round(trend.points + momentum.points + structure.points + risk.points);
  const decision: "LONG" | "SHORT" | "WAIT" = totalScore >= config.thresholds.action ? (trend.context === "BULLISH" ? "LONG" : "SHORT") : "WAIT";
  
  // İşlem seviyelerini hesapla (sadece LONG veya SHORT kararlarında)
  let tradeLevels: { entryPrice: number; takeProfit: number; stopLoss: number } | undefined;
  
  if (decision === "LONG" || decision === "SHORT") {
    const entryPrice = price;
    const atr = indicators.atr!;
    
    if (decision === "LONG") {
      // LONG: StopLoss = Fiyat - (2 * ATR), TakeProfit = Fib 100%
      const stopLoss = entryPrice - (2 * atr);
      const takeProfit = indicators.fib_end_price || entryPrice + (3 * atr); // Fallback: 3 ATR yukarı
      
      tradeLevels = {
        entryPrice,
        takeProfit,
        stopLoss: Math.max(0, stopLoss) // Negatif fiyat olmasın
      };
    } else {
      // SHORT: StopLoss = Fiyat + (2 * ATR), TakeProfit = Fib 0%
      const stopLoss = entryPrice + (2 * atr);
      const takeProfit = indicators.fib_start_price || entryPrice - (3 * atr); // Fallback: 3 ATR aşağı
      
      tradeLevels = {
        entryPrice,
        takeProfit: Math.max(0, takeProfit), // Negatif fiyat olmasın
        stopLoss
      };
    }
  }
  
  return {
    coin, decision, score: totalScore, showInUI: totalScore >= config.thresholds.watchlist,
    trend: {
      context: trend.context,
      points: trend.points,
      adx: indicators.adx!,
      adxStrength: trend.adxStrength,
      maStructure: trend.maStructure,
      priceVsMA100: trend.priceVsMA100
    },
    momentum: {
      points: momentum.points,
      rsi: indicators.rsi!,
      zone: momentum.zone,
      status: momentum.status
    },
    structure: {
      points: structure.points,
      fibCheck: structure.fibCheck,
      fibValue: indicators.fib_value!,
      distance: structure.distance,
      distanceInATR: structure.distanceInATR
    },
    risk: {
      points: risk.points,
      atrPercent: risk.atrPercent,
      assessment: risk.assessment,
      stopLossRisk: risk.stopLossRisk
    },
    tradeLevels,
    justification: generateJustification(trend.context, totalScore, decision, indicators.adx!, trend.maStructure, indicators.rsi!, momentum.zone, structure.fibCheck, structure.distanceInATR, risk.atrPercent, risk.assessment, config.thresholds)
  };
}

function createEmptySignal(coin: CryptoCoin, ind: SwingIndicators, trend?: TrendResult): SignalResult {
  return {
    coin, decision: "WAIT", score: 0, showInUI: false,
    trend: trend || { context: "NEUTRAL", points: 0, adx: ind.adx || 0, adxStrength: "WEAK", maStructure: "MESSY", priceVsMA100: "AT" },
    momentum: { points: 0, rsi: ind.rsi || 0, zone: "WEAK", status: "Veri yok" },
    structure: { points: 0, fibCheck: "INVALID", fibValue: ind.fib_value || 0, distance: 0, distanceInATR: 0 },
    risk: { points: 0, atrPercent: 0, assessment: "EXTREME", stopLossRisk: 0 },
    tradeLevels: undefined, // WAIT durumunda işlem seviyeleri yok
    justification: "Veri eksik veya trend yok."
  };
}

function createForceWaitSignal(
  coin: CryptoCoin, 
  ind: SwingIndicators, 
  trend: TrendResult, 
  mom: MomentumResult, 
  struct: StructureResult, 
  risk: RiskResult
): SignalResult {
  return {
    coin, decision: "WAIT", score: 0, showInUI: false,
    trend: {
      context: trend.context,
      points: trend.points,
      adx: ind.adx!,
      adxStrength: trend.adxStrength,
      maStructure: trend.maStructure,
      priceVsMA100: trend.priceVsMA100
    },
    momentum: {
      points: mom.points,
      rsi: ind.rsi!,
      zone: mom.zone,
      status: mom.status
    },
    structure: {
      points: struct.points,
      fibCheck: struct.fibCheck,
      fibValue: ind.fib_value!,
      distance: struct.distance,
      distanceInATR: struct.distanceInATR
    },
    risk: {
      points: risk.points,
      atrPercent: risk.atrPercent,
      assessment: risk.assessment,
      stopLossRisk: risk.stopLossRisk
    },
    tradeLevels: undefined, // WAIT durumunda işlem seviyeleri yok
    justification: struct.forceWait ? "Yapı kırılgan." : "Risk çok yüksek."
  };
}

function generateJustification(
  ctx: string, 
  score: number, 
  dec: string, 
  adx: number, 
  ma: string, 
  rsi: number, 
  zone: string, 
  fib: string, 
  dist: number, 
  vol: number, 
  risk: string, 
  thr: { action: number; watchlist: number }
): string {
  const parts = [];
  parts.push(`${ctx === "BULLISH" ? "Yükseliş" : "Düşüş"} (${ma}). ADX ${adx.toFixed(1)}.`);
  parts.push(`RSI ${rsi.toFixed(1)} (${zone}).`);
  parts.push(fib === "VALID_SAFE" ? `Yapı güvenli.` : "Yapı zayıf.");
  if (score >= thr.action) parts.push(`Skor ${score} ${dec} onaylıyor.`);
  return parts.join(" ");
}
