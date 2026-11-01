import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";
import crypto from "crypto";

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

export async function POST(req: NextRequest) {
  try {
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const validExtensions = [
      ".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif",
      ".pdf", ".doc", ".docx", ".rtf", ".txt"
    ];
    const validMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/rtf",
      "text/plain"
    ];

    const isValidType = (file.type && validMimeTypes.includes(file.type)) || (ext && validExtensions.includes(ext));
    if (!isValidType) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, DOC, DOCX, TXT, RTF, PNG, JPG, WEBP, SVG, GIF" },
        { status: 400 }
      );
    }

    // Max 15MB
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds 15MB size limit" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Try saving to public/uploads (works in local dev & persistent servers)
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileExt = ext || (file.type === "application/pdf" ? ".pdf" : ".png");
      const baseName = path
        .basename(file.name, fileExt)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "-")
        .slice(0, 30);
      const fileName = `${Date.now()}-${baseName}${fileExt}`;
      const filePath = path.join(uploadsDir, fileName);

      fs.writeFileSync(filePath, buffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/${fileName}`,
        name: file.name,
        size: file.size
      });
    } catch {
      // In Vercel serverless (read-only filesystem), encode as Base64 Data URL
      // This allows immediate rendering and persistence without requiring external S3
      const base64 = buffer.toString("base64");
      const mime = file.type || (ext === ".pdf" ? "application/pdf" : "application/octet-stream");
      const dataUrl = `data:${mime};base64,${base64}`;

      return NextResponse.json({
        success: true,
        url: dataUrl,
        name: file.name,
        size: file.size,
        note: "Stored as optimized Data URL for serverless resilience"
      });
    }
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Failed to process file upload." },
      { status: 500 }
    );
  }
}
