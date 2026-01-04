import { NextRequest } from "next/server";
import { handleTaapiRequest } from "@/lib/taapi";

export async function GET(request: NextRequest) {
  return handleTaapiRequest(request, {
    endpoint: "rsi",
    defaultInterval: "4h",
    errorMessage: "RSI değeri alınırken bir hata oluştu",
  });
}
