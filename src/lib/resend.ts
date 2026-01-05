const RESEND_API_KEY = "re_7mbg7KX8_QEFZzezDpY53jm6eaTGT8J9n";
const RESEND_FROM_EMAIL = "iBilet <info@mail.ibilet.com>";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Resend API kullanarak email gönderir
 */
export async function sendEmail(options: EmailOptions): Promise<unknown> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API Error:", data);
      return { success: false, error: data };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending email via Resend:", error);
    return { success: false, error };
  }
}

/**
 * Trade Sinyali için özel email formatı oluşturur ve gönderir
 */
export async function sendSignalEmail(
  to: string | string[],
  coinSymbol: string,
  decision: "LONG" | "SHORT" | "WAIT",
  score: number,
  price: number,
  justification: string
): Promise<unknown> {
  const color = decision === "LONG" ? "#10b981" : decision === "SHORT" ? "#ef4444" : "#6b7280";
  const typeText = decision === "LONG" ? "YÜKSELİŞ (LONG)" : decision === "SHORT" ? "DÜŞÜŞ (SHORT)" : "BEKLE";

  const subject = `[SİNYAL] ${coinSymbol} - ${typeText} (${score}/100)`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: ${color}; margin-top: 0;">${coinSymbol} Yeni Sinyal Tespit Edildi</h2>
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
        <p style="margin: 5px 0;"><strong>Karar:</strong> <span style="color: ${color}; font-weight: bold;">${typeText}</span></p>
        <p style="margin: 5px 0;"><strong>Güven Skoru:</strong> ${score}/100</p>
        <p style="margin: 5px 0;"><strong>Fiyat:</strong> $${price.toLocaleString()}</p>
      </div>
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 16px; margin-bottom: 10px;">Analiz Özeti:</h3>
        <p style="color: #4b5563; line-height: 1.5;">${justification}</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        Bu e-posta iBilet Sinyal Motoru tarafından otomatik olarak gönderilmiştir.
      </p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}
