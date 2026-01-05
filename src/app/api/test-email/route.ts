import { NextRequest, NextResponse } from "next/server";
import { getCoinsWithSwingIndicators } from "@/lib/supabase/indicators";
import { calculateSignal } from "@/lib/signal-engine";
import { sendSignalEmail } from "@/lib/resend";

export async function GET(request: NextRequest) {
  try {
    const targetEmail = "smlbrnc@gmail.com";
    
    // 1. Bir tane coin verisi al
    const coinsWithIndicators = await getCoinsWithSwingIndicators();
    
    if (coinsWithIndicators.length === 0) {
      return NextResponse.json({ error: "Veritabanında analiz edilecek coin bulunamadı." });
    }

    // İlk coini alalım (Örn: BTC)
    const { coin, indicators } = coinsWithIndicators[0];
    
    // 2. Signal hesapla
    const signal = calculateSignal(indicators, coin);
    
    // 3. Test maili gönder
    console.log(`[Test Email] ${coin.symbol} için ${targetEmail} adresine mail gönderiliyor...`);
    
    const result = await sendSignalEmail(
      targetEmail,
      coin.symbol.toUpperCase(),
      signal.decision,
      signal.score,
      coin.current_price,
      "BU BİR TEST E-POSTASIDIR. \n\n" + signal.justification
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test sinyal e-postası ${targetEmail} adresine başarıyla gönderildi.`,
        coin: coin.symbol,
        decision: signal.decision,
        score: signal.score
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: "E-posta gönderimi başarısız oldu."
      }, { status: 500 });
    }
  } catch (error) {
    console.error("[Test Email] Hata:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    }, { status: 500 });
  }
}
