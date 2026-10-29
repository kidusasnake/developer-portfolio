import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const AUTH_COOKIE_NAME = "portfolio_admin_token";
const AUTH_TOKEN = "auth_session_token_antigravity_cms_7482";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    if (password === ADMIN_PASSWORD) {
      const cookieStore = await cookies();
      cookieStore.set(AUTH_COOKIE_NAME, AUTH_TOKEN, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      return NextResponse.json({ success: true, authenticated: true });
    }

    return NextResponse.json(
      { success: false, message: "Invalid password. Default is admin123" },
      { status: 401 }
    );
  } catch (err) {
    console.error("Auth error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = token === AUTH_TOKEN;

  return NextResponse.json({
    authenticated: isAuthenticated
  });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  return NextResponse.json({ success: true, message: "Logged out" });
}
