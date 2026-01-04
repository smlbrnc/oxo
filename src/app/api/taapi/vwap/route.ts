import { NextRequest } from "next/server";
import { handleTaapiRequest } from "@/lib/taapi";

export async function GET(request: NextRequest) {
  return handleTaapiRequest(request, {
    endpoint: "vwap",
    defaultInterval: "1h",
    errorMessage: "VWAP değeri alınırken bir hata oluştu",
  });
}
