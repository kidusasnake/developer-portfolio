export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<{ success: boolean; provider: string; error?: string }> {
  // 1. Resend API (Zero-dependency native fetch)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
          text: text || "Your Portfolio verification code"
        })
      });

      if (res.ok) {
        return { success: true, provider: "Resend" };
      }
      const errData = await res.json();
      console.warn("Resend API warning:", errData);
    } catch (err) {
      console.error("Resend delivery failed:", err);
    }
  }

  // 2. Generic Webhook / SendGrid API
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (sendgridKey) {
    try {
      const fromEmail = process.env.EMAIL_FROM || "admin@kidusasnake.pro.et";
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: fromEmail },
          subject,
          content: [{ type: "text/html", value: html }]
        })
      });

      if (res.ok) {
        return { success: true, provider: "SendGrid" };
      }
    } catch (err) {
      console.error("SendGrid delivery failed:", err);
    }
  }

  // 3. Fallback: Log to console in server logs
  console.log(`[AUTH-EMAIL-FALLBACK] Sending verification email to ${to}: ${subject}`);
  return {
    success: true,
    provider: "Console/Fallback (Configure RESEND_API_KEY on Vercel for live inbox delivery)"
  };
}
