import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { sendEmail } from "@/lib/mailer";
import { getPortfolioData } from "@/lib/portfolio-data";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const AUTH_COOKIE_NAME = "portfolio_admin_token";

// Memory storage for OTP codes: email -> { code, expiresAt }
// Global symbol prevents wiping during hot reloads
const globalForAuth = global as unknown as {
  resetCodes?: Map<string, { code: string; expiresAt: number }>;
};
const resetCodes = globalForAuth.resetCodes || new Map<string, { code: string; expiresAt: number }>();
if (process.env.NODE_ENV !== "production") globalForAuth.resetCodes = resetCodes;

function getExpectedSessionToken(): string {
  return crypto
    .createHmac("sha256", ADMIN_PASSWORD)
    .update("portfolio_admin_session_auth")
    .digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, code, rememberMe } = body;

    const portfolio = getPortfolioData();
    const adminEmail = (process.env.ADMIN_EMAIL || portfolio.profile.email || "kidusasnake003@gmail.com").toLowerCase().trim();

    // 1. REQUEST RECOVERY CODE
    if (action === "request_code") {
      const inputEmail = (email || "").toLowerCase().trim();

      if (!inputEmail || inputEmail !== adminEmail) {
        return NextResponse.json(
          { error: "The provided email does not match the registered portfolio owner email." },
          { status: 400 }
        );
      }

      // Generate 6-digit numeric OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

      resetCodes.set(adminEmail, { code: otp, expiresAt });

      // Build modern HTML email
      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f8fafc; padding: 40px 20px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #6366f1, #06b6d4); padding: 2px; border-radius: 12px;">
              <div style="background-color: #090d16; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 18px; color: #38bdf8;">
                Portfolio Admin Recovery
              </div>
            </div>
          </div>
          <h2 style="color: #ffffff; text-align: center; margin-bottom: 8px;">Admin Password Reset Code</h2>
          <p style="color: #94a3b8; text-align: center; font-size: 14px; margin-bottom: 24px;">
            Use the following single-use verification code to log in to your portfolio CMS.
          </p>
          <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8;">
              ${otp}
            </span>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center;">
            This code will expire in <strong>15 minutes</strong>. If you did not request this code, you can safely ignore this email.
          </p>
        </div>
      `;

      const emailResult = await sendEmail({
        to: adminEmail,
        subject: `Your Portfolio CMS Reset Code: ${otp}`,
        html: htmlContent,
        text: `Your Portfolio CMS verification code is: ${otp}. It expires in 15 minutes.`
      });

      // Masked email for display
      const [user, domain] = adminEmail.split("@");
      const maskedEmail = `${user.slice(0, 2)}***@${domain}`;

      return NextResponse.json({
        success: true,
        message: `Recovery code dispatched to ${maskedEmail}`,
        email: maskedEmail,
        provider: emailResult.provider,
        devCode: emailResult.provider.includes("Fallback") ? otp : undefined
      });
    }

    // 2. VERIFY CODE & LOG IN
    if (action === "verify_and_login") {
      const inputEmail = (email || "").toLowerCase().trim();
      const inputCode = (code || "").trim();

      const record = resetCodes.get(inputEmail || adminEmail);

      if (!record) {
        return NextResponse.json(
          { error: "No active recovery code found. Please request a new code." },
          { status: 400 }
        );
      }

      if (Date.now() > record.expiresAt) {
        resetCodes.delete(inputEmail || adminEmail);
        return NextResponse.json(
          { error: "Verification code has expired. Please request a fresh code." },
          { status: 400 }
        );
      }

      if (record.code !== inputCode) {
        return NextResponse.json(
          { error: "Incorrect verification code. Please check your email and try again." },
          { status: 400 }
        );
      }

      // Valid OTP: delete used code and issue session cookie
      resetCodes.delete(inputEmail || adminEmail);

      const cookieStore = await cookies();
      const token = getExpectedSessionToken();
      const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7; // 30 days vs 7 days

      cookieStore.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge
      });

      return NextResponse.json({
        success: true,
        authenticated: true,
        message: "Successfully verified. Welcome back to your CMS dashboard!"
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Reset route error:", err);
    return NextResponse.json(
      { error: "Failed to process recovery request." },
      { status: 500 }
    );
  }
}
