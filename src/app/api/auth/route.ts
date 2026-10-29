import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const AUTH_COOKIE_NAME = "portfolio_admin_token";

// Compute a deterministic session signature based on ADMIN_PASSWORD
function getSessionToken(): string {
  return crypto
    .createHmac("sha256", ADMIN_PASSWORD)
    .update("portfolio_admin_session_auth")
    .digest("hex");
}

// Timing-safe password check
function verifyPassword(input: string, expected: string): boolean {
  if (typeof input !== "string" || typeof expected !== "string") return false;
  const h1 = crypto.createHash("sha256").update(input).digest();
  const h2 = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(h1, h2);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, rememberMe } = body;

    if (password && verifyPassword(password, ADMIN_PASSWORD)) {
      const cookieStore = await cookies();
      const token = getSessionToken();
      const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7; // 30 days vs 7 days

      cookieStore.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge
      });

      return NextResponse.json({ success: true, authenticated: true });
    }

    return NextResponse.json(
      { success: false, message: "Invalid credentials. Verify your ADMIN_PASSWORD environment variable or default admin123." },
      { status: 401 }
    );
  } catch (err) {
    console.error("Auth error:", err);
    return NextResponse.json({ success: false, message: "Server error occurred during authentication." }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const expectedToken = getSessionToken();
  const isAuthenticated = !!token && token === expectedToken;

  return NextResponse.json({
    authenticated: isAuthenticated
  });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  return NextResponse.json({ success: true, message: "Logged out" });
}
