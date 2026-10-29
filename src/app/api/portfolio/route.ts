import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import {
  getPortfolioDataAsync,
  addProjectAsync,
  updateProjectAsync,
  deleteProjectAsync,
  addCertificationAsync,
  updateCertificationAsync,
  deleteCertificationAsync,
  updateProfileAsync,
  savePortfolioDataAsync,
  getStorageStatus
} from "@/lib/portfolio-data";
import { PortfolioData } from "@/types/portfolio";

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

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get("action");

  // Storage status endpoint
  if (action === "status") {
    const status = getStorageStatus();
    return NextResponse.json(status);
  }

  const data = await getPortfolioDataAsync();

  // Export / Download JSON attachment
  if (searchParams.get("download") === "true") {
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="portfolio.json"',
        "Cache-Control": "no-store, max-age=0"
      }
    });
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
}

export async function POST(req: NextRequest) {
  // Check authorization
  const authorized = await isAuthorized();
  if (!authorized) {
    return NextResponse.json(
      { error: "Unauthorized. Please authenticate in the admin dashboard." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    switch (action) {
      case "add_project": {
        const newProj = await addProjectAsync(payload);
        revalidatePath("/");
        return NextResponse.json({ success: true, item: newProj });
      }
      case "update_project": {
        const { id, ...updates } = payload;
        const updated = await updateProjectAsync(id, updates);
        revalidatePath("/");
        return NextResponse.json({ success: true, item: updated });
      }
      case "delete_project": {
        const { id } = payload;
        const deleted = await deleteProjectAsync(id);
        revalidatePath("/");
        return NextResponse.json({ success: true, deleted });
      }
      case "add_certification": {
        const newCert = await addCertificationAsync(payload);
        revalidatePath("/");
        return NextResponse.json({ success: true, item: newCert });
      }
      case "update_certification": {
        const { id, ...updates } = payload;
        const updated = await updateCertificationAsync(id, updates);
        revalidatePath("/");
        return NextResponse.json({ success: true, item: updated });
      }
      case "delete_certification": {
        const { id } = payload;
        const deleted = await deleteCertificationAsync(id);
        revalidatePath("/");
        return NextResponse.json({ success: true, deleted });
      }
      case "update_profile": {
        const updatedProfile = await updateProfileAsync(payload);
        revalidatePath("/");
        return NextResponse.json({ success: true, profile: updatedProfile });
      }
      case "import_data": {
        const importedData = payload as PortfolioData;
        if (!importedData.profile || !Array.isArray(importedData.projects) || !Array.isArray(importedData.certifications)) {
          return NextResponse.json({ error: "Invalid portfolio data structure" }, { status: 400 });
        }
        await savePortfolioDataAsync(importedData);
        revalidatePath("/");
        return NextResponse.json({ success: true, data: importedData });
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error("Portfolio action error:", err);
    return NextResponse.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
