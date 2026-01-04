import { NextRequest } from "next/server";
import { handleTaapiRequest } from "@/lib/taapi";

export async function GET(request: NextRequest) {
  return handleTaapiRequest(request, {
    endpoint: "atr",
    errorMessage: "ATR verileri çekilirken bir hata oluştu",
  });
}
