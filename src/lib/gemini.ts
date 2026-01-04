import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("GOOGLE_GEMINI_API_KEY environment variable is not set");
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface AnalysisRequest {
  coinName: string;
  symbol: string;
  price: number;
  tradingStrategy: "scalp" | "swing";
  // Scalping göstergeleri
  atr?: number;
  vwap?: number;
  bbands?: {
    upper: number;
    middle: number;
    lower: number;
  };
  pivot?: {
    r3: number;
    r2: number;
    r1: number;
    p: number;
    s1: number;
    s2: number;
    s3: number;
  };
  rsi?: number;
  // Swing trade göstergeleri
  ma?: number;
  fib?: {
    value: number;
    trend: string;
    startPrice: number;
    endPrice: number;
  };
  adx?: number;
}

export async function generateAnalysis(request: AnalysisRequest): Promise<string> {
  if (!genAI) {
    throw new Error("Gemini API key is not configured");
  }

  // Use gemini-3-pro-preview model as shown in the curl example
  const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

  const prompt = createAnalysisPrompt(request);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text.trim();
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Better error messages
    if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("Quota exceeded")) {
      throw new Error("API quota limitine ulaşıldı. Lütfen birkaç dakika sonra tekrar deneyin.");
    }
    if (errorMessage.includes("API_KEY") || errorMessage.includes("401") || errorMessage.includes("403")) {
      throw new Error("Geçersiz API key. Lütfen .env.local dosyasındaki GOOGLE_GEMINI_API_KEY değerini kontrol edin.");
    }
    
    throw new Error(`Analiz oluşturulurken bir hata oluştu: ${errorMessage || "Bilinmeyen hata"}`);
  }
}

function createAnalysisPrompt(request: AnalysisRequest): string {
  const { coinName, symbol, price, tradingStrategy } = request;

  if (tradingStrategy === "scalp") {
    // Scalping analizi
    const { atr, vwap, bbands, pivot, rsi } = request;
    
    let prompt = `Sen bir kripto para teknik analiz uzmanısın. Aşağıdaki ${coinName} (${symbol}) kripto para birimi için SCALPING stratejisi ile teknik analiz yap ve Türkçe olarak detaylı bir analiz raporu hazırla.

**Fiyat Bilgileri:**
- Güncel Fiyat: $${price.toFixed(2)}

**Scalping Teknik Göstergeler:**`;

    if (atr !== undefined) {
      prompt += `\n- ATR (Average True Range): ${atr.toFixed(2)} - Risk yönetimi için kritik. Scalping'te sık stop-loss ayarlamaları gerektiğinden ATR volatilite ölçümü çok önemlidir.`;
    }
    
    if (vwap !== undefined) {
      prompt += `\n- VWAP (Volume-Weighted Average Price): $${vwap.toFixed(2)} - Günlük işlemlerde güçlü referans noktası. VWAP üzerindeki fiyatlar yükseliş, altındaki fiyatlar düşüş sinyali.`;
    }
    
    if (bbands) {
      prompt += `\n- Bollinger Bands:
  * Üst Bant: $${bbands.upper.toFixed(2)}
  * Orta Bant: $${bbands.middle.toFixed(2)}
  * Alt Bant: $${bbands.lower.toFixed(2)}
  - Volatilite ve potansiyel dönüş noktalarını gösterir. Bantların daralması (squeeze) büyük hareket öncesi sinyal verebilir.`;
    }
    
    if (pivot) {
      prompt += `\n- Pivot Points:
  * Direnç Seviyeleri: R3: $${pivot.r3.toFixed(2)}, R2: $${pivot.r2.toFixed(2)}, R1: $${pivot.r1.toFixed(2)}
  * Pivot: $${pivot.p.toFixed(2)}
  * Destek Seviyeleri: S1: $${pivot.s1.toFixed(2)}, S2: $${pivot.s2.toFixed(2)}, S3: $${pivot.s3.toFixed(2)}
  - Kısa vadeli destek ve direnç seviyelerini belirler.`;
    }
    
    if (rsi !== undefined) {
      prompt += `\n- RSI (Relative Strength Index): ${rsi.toFixed(2)} - Kısa vadeli momentum tespiti için kullanılır.`;
    }

    prompt += `\n\nLütfen şunları analiz et:
1. ATR değerine göre volatilite analizi ve stop-loss önerileri
2. VWAP ve fiyat ilişkisi (yükseliş/düşüş sinyalleri)
3. Bollinger Bands analizi (volatilite ve potansiyel dönüş noktaları)
4. Pivot Points seviyelerine göre destek ve direnç analizi
5. RSI değerinin yorumlanması (aşırı alım/satım durumu)
6. Scalping için kısa vadeli giriş/çıkış önerileri
7. Risk yönetimi önerileri

Analizi 200-300 kelime arasında, profesyonel ve anlaşılır bir dille Türkçe olarak yaz. Scalping stratejisine uygun, hızlı karar vermeye yönelik pratik öneriler sun.`;

    return prompt;
  } else {
    // Swing trade analizi
    const { ma, atr, fib, rsi, adx } = request;
    
    let prompt = `Sen bir kripto para teknik analiz uzmanısın. Aşağıdaki ${coinName} (${symbol}) kripto para birimi için SWING TRADE stratejisi ile teknik analiz yap ve Türkçe olarak detaylı bir analiz raporu hazırla.

**Fiyat Bilgileri:**
- Güncel Fiyat: $${price.toFixed(2)}

**Swing Trade Teknik Göstergeler:**`;

    if (ma !== undefined) {
      prompt += `\n- Moving Average (MA): $${ma.toFixed(2)} - Trend yönü belirlemede temel araç. Uzun vadeli MA'lar trend yönü için, kısa vadeli MA'lar giriş/çıkış sinyalleri için kullanılır.`;
    }
    
    if (atr !== undefined) {
      prompt += `\n- ATR (Average True Range): ${atr.toFixed(2)} - Risk yönetimi için kritik. Stop-loss ve pozisyon büyüklüğü ayarlamasında kullanılır. Volatiliteyi objektif olarak ölçer.`;
    }
    
    if (fib) {
      prompt += `\n- Fibonacci Retracement:
  * Değer: $${fib.value.toFixed(2)}
  * Trend: ${fib.trend}
  * Başlangıç Fiyatı: $${fib.startPrice.toFixed(2)}
  * Bitiş Fiyatı: $${fib.endPrice.toFixed(2)}
  - Önemli destek ve direnç seviyelerini belirler. %61.8 seviyesi özellikle güçlü bir seviyedir.`;
    }
    
    if (rsi !== undefined) {
      prompt += `\n- RSI (Relative Strength Index): ${rsi.toFixed(2)} - Momentum tespitinde etkili. Aşırı alım (70+) ve aşırı satım (30-) bölgelerini gösterir.`;
    }
    
    if (adx !== undefined) {
      prompt += `\n- ADX (Average Directional Index): ${adx.toFixed(2)} - Trend gücünü objektif olarak ölçer. 25 üzeri güçlü trend, 20 altı zayıf trend.`;
    }

    prompt += `\n\nLütfen şunları analiz et:
1. MA ve fiyat ilişkisi (trend yönü analizi)
2. ATR değerine göre volatilite ve risk yönetimi önerileri
3. Fibonacci Retracement seviyelerine göre destek ve direnç analizi
4. RSI değerinin yorumlanması (aşırı alım/satım durumu)
5. ADX değerine göre trend gücü analizi
6. Swing trade için orta vadeli giriş/çıkış önerileri
7. Trend yönü ve gücü değerlendirmesi

Analizi 200-300 kelime arasında, profesyonel ve anlaşılır bir dille Türkçe olarak yaz. Swing trade stratejisine uygun, orta vadeli pozisyon alma önerileri sun.`;

    return prompt;
  }
}
