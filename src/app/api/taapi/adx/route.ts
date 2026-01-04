import { NextRequest } from "next/server";
import { handleTaapiRequest } from "@/lib/taapi";

export async function GET(request: NextRequest) {
  return handleTaapiRequest(request, {
    endpoint: "adx",
    defaultInterval: "4h",
    errorMessage: "ADX değeri alınırken bir hata oluştu",
  });
}
