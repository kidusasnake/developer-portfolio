import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  getPortfolioData,
  addProject,
  updateProject,
  deleteProject,
  addCertification,
  updateCertification,
  deleteCertification,
  updateProfile
} from "@/lib/portfolio-data";

const AUTH_COOKIE_NAME = "portfolio_admin_token";
const AUTH_TOKEN = "auth_session_token_antigravity_cms_7482";

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return token === AUTH_TOKEN;
}

export async function GET() {
  const data = getPortfolioData();
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
      { error: "Unauthorized. Please log in to admin." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    switch (action) {
      case "add_project": {
        const newProj = addProject(payload);
        revalidatePath("/");
        return NextResponse.json({ success: true, item: newProj });
      }
      case "update_project": {
        const { id, ...updates } = payload;
        const updated = updateProject(id, updates);
        revalidatePath("/");
        return NextResponse.json({ success: true, item: updated });
      }
      case "delete_project": {
        const { id } = payload;
        const deleted = deleteProject(id);
        revalidatePath("/");
        return NextResponse.json({ success: true, deleted });
      }
      case "add_certification": {
        const newCert = addCertification(payload);
        revalidatePath("/");
        return NextResponse.json({ success: true, item: newCert });
      }
      case "update_certification": {
        const { id, ...updates } = payload;
        const updated = updateCertification(id, updates);
        revalidatePath("/");
        return NextResponse.json({ success: true, item: updated });
      }
      case "delete_certification": {
        const { id } = payload;
        const deleted = deleteCertification(id);
        revalidatePath("/");
        return NextResponse.json({ success: true, deleted });
      }
      case "update_profile": {
        const updatedProfile = updateProfile(payload);
        revalidatePath("/");
        return NextResponse.json({ success: true, profile: updatedProfile });
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
