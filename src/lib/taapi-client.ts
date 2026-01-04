/**
 * TAAPI API client helper functions
 */

interface TaapiResponse<T> {
  data: T | T[];
}

interface TaapiValueResponse {
  value: number;
}

interface TaapiFibResponse {
  value: number;
  trend: string;
  startPrice: number;
  endPrice: number;
}

interface TaapiBbandsResponse {
  valueUpperBand: number;
  valueMiddleBand: number;
  valueLowerBand: number;
}

interface TaapiPivotResponse {
  r3: number;
  r2: number;
  r1: number;
  p: number;
  s1: number;
  s2: number;
  s3: number;
}

/**
 * Generic function to fetch TAAPI data
 */
async function fetchTaapiData<T>(
  endpoint: string,
  symbol: string,
  interval: string,
  errorMessage: string
): Promise<T> {
  const response = await fetch(`/api/taapi/${endpoint}?symbol=${symbol}&interval=${interval}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || errorMessage);
  }

  const result: TaapiResponse<T> = await response.json();

  // Handle array response
  if (Array.isArray(result.data) && result.data.length > 0) {
    return result.data[0] as T;
  }

  // Handle object response
  if (result.data && typeof result.data === "object") {
    return result.data as T;
  }

  throw new Error(errorMessage);
}

/**
 * Fetch a simple numeric value (MA, ATR, RSI, ADX, VWAP)
 */
export async function fetchTaapiValue(
  endpoint: string,
  symbol: string,
  interval: string,
  errorMessage: string
): Promise<number> {
  const data = await fetchTaapiData<TaapiValueResponse>(endpoint, symbol, interval, errorMessage);
  
  if (typeof data.value === "number") {
    return data.value;
  }
  
  throw new Error(errorMessage);
}

/**
 * Fetch Fibonacci Retracement data
 */
export async function fetchTaapiFib(
  symbol: string,
  interval: string,
  errorMessage: string
): Promise<TaapiFibResponse> {
  const data = await fetchTaapiData<TaapiFibResponse>("fibonacciretracement", symbol, interval, errorMessage);
  
  if (data.value && typeof data.value === "number") {
    return {
      value: data.value,
      trend: data.trend || "N/A",
      startPrice: data.startPrice || 0,
      endPrice: data.endPrice || 0,
    };
  }
  
  throw new Error(errorMessage);
}

/**
 * Fetch Bollinger Bands data
 */
export async function fetchTaapiBbands(
  symbol: string,
  interval: string,
  errorMessage: string
): Promise<TaapiBbandsResponse> {
  const data = await fetchTaapiData<TaapiBbandsResponse>("bbands", symbol, interval, errorMessage);
  
  if (data.valueUpperBand && data.valueMiddleBand && data.valueLowerBand) {
    return {
      valueUpperBand: data.valueUpperBand,
      valueMiddleBand: data.valueMiddleBand,
      valueLowerBand: data.valueLowerBand,
    };
  }
  
  throw new Error(errorMessage);
}

/**
 * Fetch Pivot Points data
 */
export async function fetchTaapiPivot(
  symbol: string,
  interval: string,
  errorMessage: string
): Promise<TaapiPivotResponse> {
  const data = await fetchTaapiData<TaapiPivotResponse>("pivotpoints", symbol, interval, errorMessage);
  
  if (data.r3 && data.r2 && data.r1 && data.p && data.s1 && data.s2 && data.s3) {
    return {
      r3: data.r3,
      r2: data.r2,
      r1: data.r1,
      p: data.p,
      s1: data.s1,
      s2: data.s2,
      s3: data.s3,
    };
  }
  
  throw new Error(errorMessage);
}

/**
 * Helper to fetch complex indicator data with loading/error handling
 */
export async function fetchComplexIndicator<T>(
  fetchFn: () => Promise<T>,
  setLoading: (val: boolean) => void,
  setValue: (val: T) => void,
  setError: (val: string | null) => void,
  errorMessage: string
): Promise<void> {
  setLoading(true);
  try {
    const data = await fetchFn();
    setValue(data);
    setError(null);
  } catch (error) {
    console.error("Error fetching indicator:", error);
    setError(error instanceof Error ? error.message : errorMessage);
  } finally {
    setLoading(false);
  }
}
