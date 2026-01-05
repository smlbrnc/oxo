import { CryptoCoin } from "./types";
import { SwingIndicators } from "./supabase/indicators";

export interface SignalResult {
  coin: CryptoCoin;
  decision: "LONG" | "SHORT" | "WAIT";
  score: number;
  showInUI: boolean; // sadece ≥55 için true
  
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
    status: string; // Human readable
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
  
  justification: string;
}

// ============================================
// STEP 1: TREND IDENTIFICATION (ABSOLUTE GATE)
// ============================================
function evaluateTrend(indicators: SwingIndicators, price: number) {
  const { ma50, ma100, ma200, adx } = indicators;
  
  // Check if required values exist
  if (!ma50 || !ma100 || !ma200 || !adx) {
    return {
      context: "NEUTRAL" as const,
      pass: false,
      points: 0,
      adxStrength: "WEAK" as const,
      maStructure: "MESSY" as const,
      priceVsMA100: (price > (ma100 || 0) ? "ABOVE" : "BELOW") as "ABOVE" | "BELOW",
    };
  }
  
  // Check ADX minimum
  if (adx < 25) {
    return {
      context: "NEUTRAL" as const,
      pass: false,
      points: 0,
      adxStrength: "WEAK" as const,
      maStructure: "MESSY" as const,
      priceVsMA100: (price > ma100 ? "ABOVE" : "BELOW") as "ABOVE" | "BELOW",
    };
  }
  
  // Bullish setup check
  const bullishAlignment = ma50 > ma100 && ma100 > ma200;
  const priceAboveMA100 = price > ma100;
  
  if (bullishAlignment && priceAboveMA100) {
    // Lineer ADX puanlama: ADX 25 = 30 puan, ADX 40+ = 40 puan
    // ADX 25-40 arası lineer artış
    let points = 30;
    if (adx >= 40) {
      points = 40;
    } else if (adx > 25) {
      // 25-40 arası lineer: (adx - 25) / (40 - 25) * (40 - 30) + 30
      points = 30 + Math.round(((adx - 25) / 15) * 10);
    }
    // ADX 25 ise 30 puan (minimum geçerli değer)
    
    const adxStrength: "STRONG" | "MODERATE" = adx >= 40 ? "STRONG" : "MODERATE";
    return {
      context: "BULLISH" as const,
      pass: true,
      points,
      adxStrength,
      maStructure: "PERFECT" as const,
      priceVsMA100: "ABOVE" as const,
    };
  }
  
  // Bearish setup check
  const bearishAlignment = ma50 < ma100 && ma100 < ma200;
  const priceBelowMA100 = price < ma100;
  
  if (bearishAlignment && priceBelowMA100) {
    // Lineer ADX puanlama: ADX 25 = 30 puan, ADX 40+ = 40 puan
    let points = 30;
    if (adx >= 40) {
      points = 40;
    } else if (adx > 25) {
      // 25-40 arası lineer: (adx - 25) / (40 - 25) * (40 - 30) + 30
      points = 30 + Math.round(((adx - 25) / 15) * 10);
    }
    
    const adxStrength: "STRONG" | "MODERATE" = adx >= 40 ? "STRONG" : "MODERATE";
    return {
      context: "BEARISH" as const,
      pass: true,
      points,
      adxStrength,
      maStructure: "PERFECT" as const,
      priceVsMA100: "BELOW" as const,
    };
  }
  
  // Neither context met → FAIL
  return {
    context: "NEUTRAL" as const,
    pass: false,
    points: 0,
    adxStrength: adx >= 40 ? ("STRONG" as const) : ("MODERATE" as const),
    maStructure: bullishAlignment || bearishAlignment ? ("PARTIAL" as const) : ("MESSY" as const),
    priceVsMA100: price > ma100 ? ("ABOVE" as const) : ("BELOW" as const),
  };
}

// ============================================
// STEP 2: MOMENTUM CONTROL (RSI) - Dereceli Puanlama
// ============================================
function evaluateMomentum(rsi: number | null, context: "BULLISH" | "BEARISH" | "NEUTRAL") {
  if (context === "NEUTRAL" || rsi === null) {
    return { points: 0, zone: "WEAK" as const, status: "Geçerli trend bağlamı yok" };
  }
  
  if (context === "BULLISH") {
    // Ideal zone: 40-60 (25 points)
    if (rsi >= 40 && rsi <= 60) {
      return { points: 25, zone: "HEALTHY" as const, status: "Sağlıklı yükseliş momentumu" };
    }
    
    // Strong zone: 60-70 (dereceli puanlama)
    if (rsi > 60 && rsi <= 70) {
      // 60-65 arası: 15-20 puan, 65-70 arası: 10-15 puan
      const points = rsi <= 65 ? 20 - ((rsi - 60) * 1) : 15 - ((rsi - 65) * 1);
      return { points: Math.max(10, Math.round(points)), zone: "STRONG" as const, status: "Güçlü yükseliş momentumu" };
    }
    
    // Overbought zone: >70 (dereceli puanlama)
    if (rsi > 70) {
      // 70-75 arası: 5-10 puan, 75+ : 0-5 puan
      const points = rsi <= 75 ? 10 - ((rsi - 70) * 1) : Math.max(0, 5 - ((rsi - 75) * 0.5));
      return { points: Math.max(0, Math.round(points)), zone: "OVERBOUGHT" as const, status: "Aşırı alım uyarısı" };
    }
    
    // Weak zone: <40 (dereceli puanlama)
    // 30-40 arası: 5-15 puan, <30: 0-5 puan
    if (rsi >= 30 && rsi < 40) {
      const points = 15 - ((40 - rsi) * 1);
      return { points: Math.max(5, Math.round(points)), zone: "WEAK" as const, status: "Zayıf momentum (RSI < 40)" };
    }
    
    // <30: çok zayıf
    return { points: 0, zone: "WEAK" as const, status: "Çok zayıf momentum (RSI < 30)" };
  }
  
  // BEARISH context - Dereceli puanlama
  // Ideal zone: 40-60 (25 points)
  if (rsi >= 40 && rsi <= 60) {
    return { points: 25, zone: "HEALTHY" as const, status: "Sağlıklı düşüş momentumu" };
  }
  
  // Strong zone: 30-40 (dereceli puanlama)
  if (rsi >= 30 && rsi < 40) {
    // 35-40 arası: 20 puan, 30-35 arası: 15 puan
    const points = rsi >= 35 ? 20 - ((40 - rsi) * 1) : 15 - ((35 - rsi) * 1);
    return { points: Math.max(10, Math.round(points)), zone: "STRONG" as const, status: "Güçlü düşüş momentumu" };
  }
  
  // Oversold zone: <30 (dereceli puanlama)
  if (rsi < 30) {
    // 20-30 arası: 5-10 puan, <20: 0-5 puan
    const points = rsi >= 20 ? 10 - ((30 - rsi) * 0.5) : Math.max(0, 5 - ((20 - rsi) * 0.5));
    return { points: Math.max(0, Math.round(points)), zone: "OVERSOLD" as const, status: "Aşırı satım uyarısı" };
  }
  
  // Weak zone: >60 (dereceli puanlama - BEARISH için zayıf)
  // 60-70 arası: 10-15 puan, 70-80 arası: 5-10 puan, 80+: 0-5 puan
  if (rsi > 60 && rsi <= 70) {
    const points = 15 - ((rsi - 60) * 0.5);
    return { points: Math.max(10, Math.round(points)), zone: "WEAK" as const, status: "Zayıf düşüş momentumu (RSI 60-70)" };
  }
  
  if (rsi > 70 && rsi <= 80) {
    const points = 10 - ((rsi - 70) * 0.5);
    return { points: Math.max(5, Math.round(points)), zone: "WEAK" as const, status: "Zayıf düşüş momentumu (RSI 70-80)" };
  }
  
  // >80: çok zayıf
  const points = Math.max(0, 5 - ((rsi - 80) * 0.25));
  return { points: Math.max(0, Math.round(points)), zone: "WEAK" as const, status: "Çok zayıf düşüş momentumu (RSI > 80)" };
}

// ============================================
// STEP 3: STRUCTURE VALIDATION (FIBONACCI) - Dereceli Puanlama
// ============================================
function evaluateStructure(
  price: number,
  fib618: number | null,
  atr: number | null,
  context: "BULLISH" | "BEARISH" | "NEUTRAL"
) {
  if (context === "NEUTRAL" || fib618 === null || atr === null || atr === 0) {
    return {
      points: 0,
      fibCheck: "INVALID" as const,
      distance: 0,
      distanceInATR: 0,
      forceWait: false,
    };
  }
  
  const distance = Math.abs(price - fib618);
  const distanceInATR = distance / atr;
  
  // LONG: Price must be ABOVE 61.8%
  if (context === "BULLISH") {
    if (price < fib618) {
      // Yanlış tarafta ama yakınsa kısmi puan ver
      // 0-1 ATR mesafede: 5-10 puan, 1-2 ATR: 0-5 puan, 2+ ATR: 0 puan
      if (distanceInATR <= 1) {
        const points = Math.max(5, Math.round(10 - (distanceInATR * 5)));
        return {
          points,
          fibCheck: "INVALID" as const,
          distance,
          distanceInATR,
          forceWait: false,
        };
      }
      if (distanceInATR <= 2) {
        const points = Math.max(0, Math.round(5 - ((distanceInATR - 1) * 5)));
        return {
          points,
          fibCheck: "INVALID" as const,
          distance,
          distanceInATR,
          forceWait: false,
        };
      }
      return {
        points: 0,
        fibCheck: "INVALID" as const,
        distance,
        distanceInATR,
        forceWait: false,
      };
    }
    
    // Valid but fragile? (<1 ATR)
    if (distanceInATR < 1) {
      return {
        points: 0,
        fibCheck: "VALID_FRAGILE" as const,
        distance,
        distanceInATR,
        forceWait: true, // FORCE WAIT
      };
    }
    
    // Valid and safe - dereceli puanlama
    // 1-2 ATR: 15-20 puan, 2-3 ATR: 20 puan (maksimum), 3+ ATR: 20 puan
    let points = 20;
    if (distanceInATR >= 1 && distanceInATR < 2) {
      // 1 ATR'de 15 puan, 2 ATR'de 20 puan
      points = 15 + Math.round((distanceInATR - 1) * 5);
    }
    
    return {
      points: Math.min(20, points),
      fibCheck: "VALID_SAFE" as const,
      distance,
      distanceInATR,
      forceWait: false,
    };
  }
  
  // SHORT: Price must be BELOW 61.8%
  if (price > fib618) {
    // Yanlış tarafta ama yakınsa kısmi puan ver
    // 0-1 ATR mesafede: 5-10 puan, 1-2 ATR: 0-5 puan, 2+ ATR: 0 puan
    if (distanceInATR <= 1) {
      const points = Math.max(5, Math.round(10 - (distanceInATR * 5)));
      return {
        points,
        fibCheck: "INVALID" as const,
        distance,
        distanceInATR,
        forceWait: false,
      };
    }
    if (distanceInATR <= 2) {
      const points = Math.max(0, Math.round(5 - ((distanceInATR - 1) * 5)));
      return {
        points,
        fibCheck: "INVALID" as const,
        distance,
        distanceInATR,
        forceWait: false,
      };
    }
    return {
      points: 0,
      fibCheck: "INVALID" as const,
      distance,
      distanceInATR,
      forceWait: false,
    };
  }
  
  // Valid but fragile? (<1 ATR)
  if (distanceInATR < 1) {
    return {
      points: 0,
      fibCheck: "VALID_FRAGILE" as const,
      distance,
      distanceInATR,
      forceWait: true,
    };
  }
  
  // Valid and safe - dereceli puanlama
  let points = 20;
  if (distanceInATR >= 1 && distanceInATR < 2) {
    // 1 ATR'de 15 puan, 2 ATR'de 20 puan
    points = 15 + Math.round((distanceInATR - 1) * 5);
  }
  
  return {
    points: Math.min(20, points),
    fibCheck: "VALID_SAFE" as const,
    distance,
    distanceInATR,
    forceWait: false,
  };
}

// ============================================
// STEP 4: VOLATILITY & RISK (ATR)
// ============================================
function evaluateRisk(atr: number | null, price: number) {
  if (atr === null || atr === 0 || price === 0) {
    return {
      points: 0,
      assessment: "EXTREME" as const,
      atrPercent: 0,
      stopLossRisk: 0,
      forceWait: true, // Missing data → WAIT
    };
  }
  
  const volatilityRatio = (atr / price) * 100;
  const stopLossRisk = (atr * 2) / price * 100; // 2*ATR stop loss
  
  // Extreme volatility
  if (volatilityRatio > 3.0) {
    return {
      points: 0,
      assessment: "EXTREME" as const,
      atrPercent: volatilityRatio,
      stopLossRisk,
      forceWait: stopLossRisk > 5, // >5% risk = FORCE WAIT
    };
  }
  
  // Elevated volatility
  if (volatilityRatio >= 2.5 && volatilityRatio <= 3.0) {
    return {
      points: 5,
      assessment: "ELEVATED" as const,
      atrPercent: volatilityRatio,
      stopLossRisk,
      forceWait: false,
    };
  }
  
  // Safe volatility (0.5% - 2.5%)
  // Signal.md: "Volatility Ratio normal (0.5% - 2.5%): 15 pts"
  if (volatilityRatio >= 0.5 && volatilityRatio <= 2.5) {
    return {
      points: 15,
      assessment: "SAFE" as const,
      atrPercent: volatilityRatio,
      stopLossRisk,
      forceWait: false,
    };
  }
  
  // Low volatility (<0.5%) - Signal.md mentions "LOW VOLATILITY (Squeeze)" but no specific points
  // Since it's not extreme and not elevated, we'll give it full points (15) as it's still safe
  // This is a conservative interpretation: squeeze can be good for entry timing
  if (volatilityRatio < 0.5) {
    return {
      points: 15, // Full points - squeeze is not a negative, just low volatility
      assessment: "SAFE" as const,
      atrPercent: volatilityRatio,
      stopLossRisk,
      forceWait: false,
    };
  }
  
  // This should not be reached, but TypeScript requires it
  return {
    points: 0,
    assessment: "EXTREME" as const,
    atrPercent: volatilityRatio,
    stopLossRisk,
    forceWait: true,
  };
}

// ============================================
// STEP 5: FINAL DECISION
// ============================================
export function calculateSignal(
  indicators: SwingIndicators,
  coin: CryptoCoin
): SignalResult {
  const price = coin.current_price;
  
  // Check for missing required data
  if (!indicators.ma50 || !indicators.ma100 || !indicators.ma200 || 
      !indicators.adx || !indicators.rsi || !indicators.atr || !indicators.fib_value) {
    return {
      coin,
      decision: "WAIT",
      score: 0,
      showInUI: false,
      trend: {
        context: "NEUTRAL",
        points: 0,
        adx: indicators.adx || 0,
        adxStrength: "WEAK",
        maStructure: "MESSY",
        priceVsMA100: "AT",
      },
      momentum: { points: 0, rsi: indicators.rsi || 0, zone: "WEAK", status: "Veri eksik" },
      structure: { points: 0, fibCheck: "INVALID", fibValue: indicators.fib_value || 0, distance: 0, distanceInATR: 0 },
      risk: { points: 0, atrPercent: 0, assessment: "EXTREME", stopLossRisk: 0 },
      justification: "Gerekli gösterge verileri eksik. Sinyal hesaplanamıyor. Veri mevcut olana kadar bekleyin.",
    };
  }
  
  // STEP 1: Trend Filter (ABSOLUTE GATE)
  const trend = evaluateTrend(indicators, price);
  
  // If trend filter fails → FORCE WAIT, Score 0, DON'T SHOW
  if (!trend.pass) {
    return {
      coin,
      decision: "WAIT",
      score: 0,
      showInUI: false, // ❌ Don't show in UI
      trend: {
        context: trend.context,
        points: 0,
        adx: indicators.adx!,
        adxStrength: trend.adxStrength,
        maStructure: trend.maStructure,
        priceVsMA100: trend.priceVsMA100,
      },
      momentum: { points: 0, rsi: indicators.rsi!, zone: "WEAK", status: "Geçerli trend yok" },
      structure: { points: 0, fibCheck: "INVALID", fibValue: indicators.fib_value!, distance: 0, distanceInATR: 0 },
      risk: { points: 0, atrPercent: 0, assessment: "SAFE", stopLossRisk: 0 },
      justification: "Trend filtresi karşılanmadı. ADX < 25 veya MA hizalaması geçersiz veya fiyat MA100 ile uyumlu değil. İşlem kurulumu mevcut değil.",
    };
  }
  
  // STEP 2: Momentum
  const momentum = evaluateMomentum(indicators.rsi, trend.context);
  
  // STEP 3: Structure
  const structure = evaluateStructure(price, indicators.fib_value, indicators.atr, trend.context);
  
  // STEP 4: Risk
  const risk = evaluateRisk(indicators.atr, price);
  
  // Check FORCE WAIT conditions
  if (structure.forceWait || risk.forceWait) {
    return {
      coin,
      decision: "WAIT",
      score: 0,
      showInUI: false, // ❌ Fragile structure or extreme risk
      trend: {
        context: trend.context,
        points: trend.points,
        adx: indicators.adx!,
        adxStrength: trend.adxStrength,
        maStructure: trend.maStructure,
        priceVsMA100: trend.priceVsMA100,
      },
      momentum: { points: momentum.points, rsi: indicators.rsi!, zone: momentum.zone, status: momentum.status },
      structure: {
        points: structure.points,
        fibCheck: structure.fibCheck,
        fibValue: indicators.fib_value!,
        distance: structure.distance,
        distanceInATR: structure.distanceInATR,
      },
      risk: { points: risk.points, atrPercent: risk.atrPercent, assessment: risk.assessment, stopLossRisk: risk.stopLossRisk },
      justification: structure.forceWait 
        ? `Kırılgan yapı tespit edildi. Fiyat kritik Fibonacci seviyesinden (${indicators.fib_value!.toFixed(2)}) ${structure.distanceInATR.toFixed(2)} ATR mesafede. Geçersizleşmeye çok yakın. Daha net kurulum için bekleyin.`
        : `Aşırı volatilite tespit edildi. ATR oranı ${risk.atrPercent.toFixed(2)}% stop loss'un kabul edilebilir risk eşiğini aşacağını gösteriyor. Daha sakin koşullar için bekleyin.`,
    };
  }
  
  // STEP 5: Calculate Total Score
  const totalScore = trend.points + momentum.points + structure.points + risk.points;
  
  // STEP 6: Determine Decision
  let decision: "LONG" | "SHORT" | "WAIT" = "WAIT";
  const showInUI = totalScore >= 55; // Only show if score ≥55
  
  if (totalScore >= 80) {
    decision = trend.context === "BULLISH" ? "LONG" : "SHORT";
  }
  
  // STEP 7: Generate Justification
  const justification = generateJustification(
    trend.context,
    totalScore,
    decision,
    indicators.adx!,
    trend.maStructure,
    indicators.rsi!,
    momentum.zone,
    structure.fibCheck,
    structure.distanceInATR,
    risk.atrPercent,
    risk.assessment
  );
  
  return {
    coin,
    decision,
    score: totalScore,
    showInUI,
    trend: {
      context: trend.context,
      points: trend.points,
      adx: indicators.adx!,
      adxStrength: trend.adxStrength,
      maStructure: trend.maStructure,
      priceVsMA100: trend.priceVsMA100,
    },
    momentum: {
      points: momentum.points,
      rsi: indicators.rsi!,
      zone: momentum.zone,
      status: momentum.status,
    },
    structure: {
      points: structure.points,
      fibCheck: structure.fibCheck,
      fibValue: indicators.fib_value!,
      distance: structure.distance,
      distanceInATR: structure.distanceInATR,
    },
    risk: {
      points: risk.points,
      atrPercent: risk.atrPercent,
      assessment: risk.assessment,
      stopLossRisk: risk.stopLossRisk,
    },
    justification,
  };
}

function generateJustification(
  context: string,
  score: number,
  decision: string,
  adx: number,
  maStructure: string,
  rsi: number,
  rsiZone: string,
  fibCheck: string,
  distanceInATR: number,
  atrPercent: number,
  riskAssessment: string
): string {
  // Cold, objective, emotionless
  const parts: string[] = [];
  
  // Trend assessment
  const contextTR = context === "BULLISH" ? "Yükseliş" : context === "BEARISH" ? "Düşüş" : "Nötr";
  const maStructureTR = maStructure === "PERFECT" ? "mükemmel" : maStructure === "PARTIAL" ? "kısmi" : "karışık";
  const adxStrengthTR = adx >= 40 ? "güçlü" : "orta";
  parts.push(
    `${contextTR} trend yapısı ${maStructureTR} MA hizalaması ile. ADX ${adx.toFixed(1)} değeri ${adxStrengthTR} yönsel momentum gösteriyor.`
  );
  
  // Momentum assessment
  const rsiZoneTR = rsiZone === "HEALTHY" ? "sağlıklı" : rsiZone === "STRONG" ? "güçlü" : rsiZone === "OVERBOUGHT" ? "aşırı alım" : rsiZone === "OVERSOLD" ? "aşırı satım" : "zayıf";
  parts.push(
    `RSI ${rsi.toFixed(1)} ${contextTR.toLowerCase()} bağlam için ${rsiZoneTR} bölgede konumlanıyor.`
  );
  
  // Structure assessment
  if (fibCheck === "VALID_SAFE") {
    parts.push(
      `Fiyat kritik Fibonacci seviyesinden ${distanceInATR.toFixed(2)} ATR mesafede, yapısal güvenlik sağlıyor.`
    );
  } else if (fibCheck === "VALID_FRAGILE") {
    parts.push(`Fibonacci doğrulaması geçerli ancak kırılgan.`);
  } else {
    parts.push(`Fibonacci doğrulaması geçersiz.`);
  }
  
  // Risk assessment
  const riskAssessmentTR = riskAssessment === "SAFE" ? "güvenli" : riskAssessment === "ELEVATED" ? "yükselmiş" : "aşırı";
  parts.push(
    `Volatilite ${atrPercent.toFixed(2)}% (${riskAssessmentTR} ortam).`
  );
  
  // Final verdict
  const decisionTR = decision === "LONG" ? "LONG" : decision === "SHORT" ? "SHORT" : "BEKLE";
  if (score >= 80) {
    parts.push(`Skor ${score}/100 ${decisionTR} değerlendirmesini haklı kılıyor. Tüm yapısal kriterler uyumlu.`);
  } else if (score >= 55) {
    parts.push(`Skor ${score}/100 izleme listesi durumunu öneriyor. Kurulum mevcut ancak optimal değil. İyileşme için izle.`);
  } else {
    parts.push(`Skor ${score}/100 giriş değerlendirmesi için yetersiz. Birden fazla kriter eşik değerin altında.`);
  }
  
  return parts.join(" ");
}
