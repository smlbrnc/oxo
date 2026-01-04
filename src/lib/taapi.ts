import { NextRequest, NextResponse } from "next/server";

const TAAPI_SECRET = process.env.TAAPI_SECRET;
const TAAPI_BASE_URL = "https://api.taapi.io";

export interface TaapiRouteOptions {
  endpoint: string;
  defaultInterval?: string;
  errorMessage?: string;
}

export async function handleTaapiRequest(
  request: NextRequest,
  options: TaapiRouteOptions
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get("symbol");
    const interval = searchParams.get("interval") || options.defaultInterval || "4h";

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parametresi gereklidir" },
        { status: 400 }
      );
    }

    if (!TAAPI_SECRET) {
      return NextResponse.json(
        { error: "TAAPI_SECRET environment variable is not set" },
        { status: 500 }
      );
    }

    // Binance formatını TAAPI formatına çevir (BTCUSDT -> BTC/USDT)
    const taapiSymbol = symbol.replace("USDT", "/USDT");

    const response = await fetch(
      `${TAAPI_BASE_URL}/${options.endpoint}?secret=${TAAPI_SECRET}&exchange=binance&symbol=${taapiSymbol}&interval=${interval}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      return NextResponse.json(
        { error: errorData.error || errorData.message || "TAAPI API hatası" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ data });
  } catch (error) {
    console.error(`TAAPI ${options.endpoint} API error:`, error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : options.errorMessage || `${options.endpoint} değeri alınırken bir hata oluştu`,
      },
      { status: 500 }
    );
  }
}
