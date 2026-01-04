import { NextRequest } from "next/server";
import { handleTaapiRequest } from "@/lib/taapi";

export async function GET(request: NextRequest) {
  return handleTaapiRequest(request, {
    endpoint: "pivotpoints",
    defaultInterval: "1h",
    errorMessage: "Pivot Points değeri alınırken bir hata oluştu",
  });
}
