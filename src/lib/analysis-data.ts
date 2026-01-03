import { AnalysisData } from "./types";

// Helper function to generate random analysis data
function generateAnalysisData(price: number): AnalysisData {
  return {
    movementIndex: {
      adx: 25 + Math.random() * 15,
      pdi: 15 + Math.random() * 15,
      mdi: 10 + Math.random() * 15,
    },
    ema: {
      value: price * (0.95 + Math.random() * 0.1),
    },
    price: {
      value: price,
    },
    rsi: {
      value: 30 + Math.random() * 40,
    },
    candle: {
      timestampHuman: new Date().toLocaleString("tr-TR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " UTC",
      timestamp: Math.floor(Date.now() / 1000),
      open: price * (0.98 + Math.random() * 0.04),
      high: price * (1.01 + Math.random() * 0.02),
      low: price * (0.97 + Math.random() * 0.02),
      close: price,
      volume: 100 + Math.random() * 2000,
    },
  };
}

// Mock analysis data for each coin
export const mockAnalysisData: Record<string, AnalysisData> = {
  bitcoin: {
    movementIndex: {
      adx: 32.79044853218805,
      pdi: 25.418284332339116,
      mdi: 16.2144851753789,
    },
    ema: {
      value: 134.8259211745199,
    },
    price: {
      value: 20329.49,
    },
    rsi: {
      value: 65.73211579249397,
    },
    candle: {
      timestampHuman: "2021-01-14 15:00:00 UTC",
      timestamp: 1610636400,
      open: 39577.53,
      high: 39666,
      low: 39294.7,
      close: 39607.09,
      volume: 1211.2841909999893,
    },
  },
};

// Helper function to get analysis data for a coin
export function getAnalysisData(coinId: string, currentPrice?: number): AnalysisData | null {
  // If we have specific data for this coin, return it
  if (mockAnalysisData[coinId]) {
    return mockAnalysisData[coinId];
  }
  
  // Otherwise generate mock data based on current price
  if (currentPrice) {
    return generateAnalysisData(currentPrice);
  }
  
  return null;
}
