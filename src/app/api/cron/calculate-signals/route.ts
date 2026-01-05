import { NextRequest, NextResponse } from "next/server";
import { getCoinsWithSwingIndicators } from "@/lib/supabase/indicators";
import { calculateSignal } from "@/lib/signal-engine";
import { saveSignal, getLatestSignal, compareSignals, SignalChange } from "@/lib/supabase/signals";
import { queueAlert } from "@/lib/supabase/alerts";

export const dynamic = "force-dynamic";

/**
 * External Cron Job (Cron-job.org vb.): Tüm coinler için signal hesapla
 * 
 * Güvenlik için Authorization header kontrolü yapılır.
 */
export async function GET(request: NextRequest) {
  try {
    // API Güvenlik Kontrolü
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    // Eğer CRON_SECRET tanımlıysa kontrol et, tanımlı değilse (development) geç
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[Cron] Yetkisiz erişim denemesi!");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[Cron] Signal hesaplama tetiklendi:", new Date().toISOString());

    // Tüm coinler ve indicators'ları getir
    const coinsWithIndicators = await getCoinsWithSwingIndicators();
    
    if (coinsWithIndicators.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Hesaplanacak coin bulunamadı (Supabase veya Binance kaynaklı olabilir)",
        processed: 0,
        successful: 0,
        failed: 0,
        diagnostics: {
          timestamp: new Date().toISOString(),
          supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabase_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          cron_secret: !!process.env.CRON_SECRET,
        }
      });
    }

    let successful = 0;
    let failed = 0;
    const errors: Array<{ coin: string; error: string }> = [];
    const alertCandidates: Array<{ coin: string; change: SignalChange }> = [];

    // Her coin için signal hesapla
    for (const { coin, indicators } of coinsWithIndicators) {
      try {
        // Önceki signal'ı al (kaydetmeden önce)
        const previousSignal = await getLatestSignal(coin.symbol);
        
        // Signal hesapla
        const signal = calculateSignal(indicators, coin);
        
        // Veritabanına kaydet
        const saved = await saveSignal(signal);
        
        if (saved) {
          successful++;
          
              // Önceki signal ile karşılaştır (alert için)
              if (previousSignal) {
                const change = compareSignals(previousSignal, signal);
                if (change && change.change_type !== "NO_CHANGE") {
                  alertCandidates.push({
                    coin: coin.symbol,
                    change,
                  });
                  
                  // Alert kuyruğuna ekle ve email gönder
                  await queueAlert(change, signal);
                }
              } else if (signal.score >= 75) {
                // İlk signal ve score >= 75 (ACTION)
                const change = compareSignals(null, signal);
                if (change) {
                  alertCandidates.push({
                    coin: coin.symbol,
                    change,
                  });
                  await queueAlert(change, signal);
                }
              }
        } else {
          failed++;
          errors.push({
            coin: coin.symbol,
            error: "Signal kaydedilemedi",
          });
        }
      } catch (error) {
        failed++;
        errors.push({
          coin: coin.symbol,
          error: error instanceof Error ? error.message : "Bilinmeyen hata",
        });
        console.error(`[Cron] ${coin.symbol} için signal hesaplama hatası:`, error);
      }
    }

    console.log(`[Cron] Signal hesaplama tamamlandı: ${successful} başarılı, ${failed} başarısız`);
    
    if (alertCandidates.length > 0) {
      console.log(`[Cron] ${alertCandidates.length} coin için alert adayı tespit edildi`);
    }

    return NextResponse.json({
      success: true,
      message: "Signal hesaplama tamamlandı",
      processed: coinsWithIndicators.length,
      successful,
      failed,
      alertCandidates: alertCandidates.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Signal hesaplama genel hatası:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
