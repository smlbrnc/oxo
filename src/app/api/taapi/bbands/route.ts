import { NextRequest } from "next/server";
import { handleTaapiRequest } from "@/lib/taapi";

export async function GET(request: NextRequest) {
  return handleTaapiRequest(request, {
    endpoint: "bbands",
    defaultInterval: "1h",
    errorMessage: "Bollinger Bands değeri alınırken bir hata oluştu",
  });
}
