export interface SignalConfig {
  // Karar Eşikleri
  thresholds: {
    action: number;    // İŞLEM (LONG/SHORT) için gereken puan (Varsayılan: 80)
    watchlist: number; // İZLEME LİSTESİ için gereken puan (Varsayılan: 55)
  };

  // Puan Dağılımı (Ağırlıklar)
  weights: {
    trend: number;     // Maksimum Trend puanı (40)
    momentum: number;  // Maksimum RSI puanı (25)
    structure: number; // Maksimum Fibonacci puanı (20)
    risk: number;      // Maksimum Risk puanı (15)
  };

  // Trend Ayarları
  trend: {
    adxMinimum: number;      // ADX kaçın altındaysa NEUTRAL (25)
    adxStrong: number;       // ADX kaçın üstündeyse STRONG (40)
    maPhaseLagGevşetme: boolean; // Reversal kuralları aktif mi?
  };

  // Yapı Ayarları
  structure: {
    fibToleranceATR: number; // Yanlış taraftaki fiyat için ATR toleransı (5)
    safeZoneATR: number;     // Güvenli bölge (VALID_SAFE) için min ATR (1)
    kademeliAzalma: boolean; // Hedefe yaklaştıkça puan azalt (True)
  };

  // Risk Ayarları
  risk: {
    maxStopLoss: number;     // Maksimum kabul edilebilir % stop loss (5)
    volatilityExtreme: number; // EXTREME kabul edilen % volatilite (3)
  }
}

export const DEFAULT_SIGNAL_CONFIG: SignalConfig = {
  thresholds: {
    action: 75,      // 80 -> 75 (Daha kolay LONG/SHORT sinyali)
    watchlist: 50,   // 55 -> 50 (Daha fazla coini izlemeye al)
  },
  weights: {
    trend: 40,
    momentum: 25,
    structure: 20,
    risk: 15,
  },
  trend: {
    adxMinimum: 20,  // 25 -> 20 (Trendi daha erken yakala)
    adxStrong: 35,   // 40 -> 35
    maPhaseLagGevşetme: true,
  },
  structure: {
    fibToleranceATR: 5,
    safeZoneATR: 0.5, // 1.0 -> 0.5 (Seviyeye çok yakınken bile WAIT'e düşme)
    kademeliAzalma: true,
  },
  risk: {
    maxStopLoss: 6,  // %5 -> %6 (Daha fazla riske tolerans)
    volatilityExtreme: 4, // %3 -> %4
  }
};
