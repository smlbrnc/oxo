import { NextRequest } from "next/server";
import { handleTaapiRequest } from "@/lib/taapi";

export async function GET(request: NextRequest) {
  return handleTaapiRequest(request, {
    endpoint: "fibonacciretracement",
    defaultInterval: "4h",
    errorMessage: "Fibonacci Retracement değeri alınırken bir hata oluştu",
  });
}
