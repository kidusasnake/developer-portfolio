import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { sendEmail } from "@/lib/mailer";
import {
  getPortfolioDataAsync,
  addContactMessageAsync,
  getContactMessagesAsync,
  deleteContactMessageAsync,
  markContactMessageReadAsync
} from "@/lib/portfolio-data";
import { ContactMessage } from "@/types/portfolio";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const AUTH_COOKIE_NAME = "portfolio_admin_token";

function getExpectedSessionToken(): string {
  return crypto
    .createHmac("sha256", ADMIN_PASSWORD)
    .update("portfolio_admin_session_auth")
    .digest("hex");
}

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return !!token && token === getExpectedSessionToken();
}

// GET: Retrieve contact messages (Admin Only)
export async function GET() {
  const authorized = await isAuthorized();
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const messages = await getContactMessagesAsync();
  return NextResponse.json({ messages });
}

// POST: Public Contact Form Submission
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    // Validation
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Please provide your name." }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return NextResponse.json({ error: "Message must be at least 5 characters long." }, { status: 400 });
    }

    const newMessage: ContactMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim().slice(0, 100),
      email: email.trim().toLowerCase().slice(0, 120),
      subject: (subject && typeof subject === "string" ? subject.trim().slice(0, 150) : "") || "New Portfolio Inquiry",
      message: message.trim().slice(0, 3000),
      createdAt: new Date().toISOString(),
      read: false
    };

    // 1. Persist to Upstash Redis & local filesystem
    await addContactMessageAsync(newMessage);

    // 2. Dispatch Email Notification
    const portfolio = await getPortfolioDataAsync();
    const recipientEmail = (process.env.ADMIN_EMAIL || portfolio.profile.email || "kidusasnake003@gmail.com").trim();

    const formattedDate = new Date().toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "UTC"
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 24px; }
            .container { max-width: 600px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
            .header { background: linear-gradient(135deg, #4f46e5, #06b6d4); padding: 28px 24px; text-align: left; }
            .header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em; }
            .header p { margin: 4px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.85); }
            .body { padding: 24px; }
            .field { margin-bottom: 18px; }
            .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 4px; }
            .value { font-size: 14px; font-weight: 500; color: #f8fafc; }
            .message-box { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; font-size: 14px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap; word-break: break-word; }
            .footer { padding: 18px 24px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; text-align: center; }
            .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Recruiter Inquiry</h1>
              <p>Received on ${formattedDate} via kidusasnake.pro.et</p>
            </div>
            <div class="body">
              <div class="field">
                <div class="label">From</div>
                <div class="value"><strong>${newMessage.name}</strong> &lt;<a href="mailto:${newMessage.email}" style="color: #38bdf8;">${newMessage.email}</a>&gt;</div>
              </div>
              <div class="field">
                <div class="label">Subject</div>
                <div class="value">${newMessage.subject}</div>
              </div>
              <div class="field">
                <div class="label">Message</div>
                <div class="message-box">${newMessage.message}</div>
              </div>
              <div style="text-align: center;">
                <a href="mailto:${newMessage.email}?subject=Re:%20${encodeURIComponent(newMessage.subject)}" class="btn">
                  Reply Directly to ${newMessage.name}
                </a>
              </div>
            </div>
            <div class="footer">
              Sent automatically from your portfolio contact form at <a href="https://kidusasnake.pro.et" style="color: #64748b;">kidusasnake.pro.et</a>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `New Recruiter Message from ${newMessage.name} (${newMessage.email}):\n\nSubject: ${newMessage.subject}\nDate: ${formattedDate}\n\nMessage:\n${newMessage.message}\n\nReply directly to: ${newMessage.email}`;

    const emailResult = await sendEmail({
      to: recipientEmail,
      subject: `[Portfolio] ${newMessage.subject} from ${newMessage.name}`,
      html: emailHtml,
      text: emailText,
      replyTo: newMessage.email
    });

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully! I will be in touch shortly.",
      deliveredToEmail: emailResult.success,
      provider: emailResult.provider
    });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "Failed to dispatch message. Please try again or email directly." },
      { status: 500 }
    );
  }
}

// DELETE: Remove or mark read (Admin Only)
export async function DELETE(req: NextRequest) {
  const authorized = await isAuthorized();
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action");

    if (!id) {
      return NextResponse.json({ error: "Message ID required" }, { status: 400 });
    }

    if (action === "mark_read") {
      await markContactMessageReadAsync(id);
      return NextResponse.json({ success: true, message: "Marked as read" });
    }

    await deleteContactMessageAsync(id);
    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    console.error("Message management error:", err);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
