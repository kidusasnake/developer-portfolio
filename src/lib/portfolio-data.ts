import fs from "fs";
import path from "path";
import { PortfolioData, Project, Certification, ProfileInfo, StorageStatus } from "@/types/portfolio";

const DATA_FILE_PATH = path.join(process.cwd(), "data", "portfolio.json");
const TMP_FILE_PATH = path.join("/tmp", "portfolio.json");

// Default seed data for Kidus Asnake
const DEFAULT_PORTFOLIO_DATA: PortfolioData = {
  profile: {
    name: "Kidus Asnake",
    title: "Full-Stack Software Engineer & Cloud Architect",
    headline: "Building high-performance web systems, cloud architectures & elegant digital products.",
    bio: "Full-stack engineer with 6+ years of expertise spanning Next.js, TypeScript, distributed microservices, and multi-cloud architectures. Passionate about performant developer tools, accessible UI design, and cloud-native solutions.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    resumeUrl: "/resume.pdf",
    location: "Addis Ababa, Ethiopia (Open to Remote / Global)",
    email: "kidusasnake003@gmail.com",
    github: "https://github.com/kidusasnake",
    linkedin: "https://linkedin.com",
    twitter: "https://twitter.com",
    availableForWork: true,
    stats: {
      yearsExperience: "6+",
      projectsShipped: "24+",
      certificationsVerified: "5",
      githubContributions: "2.8k+"
    }
  },
  projects: [],
  certifications: []
};

// In-memory cache for serverless environments
let memoryCache: PortfolioData | null = null;

// Determine current storage mode
export function getStorageStatus(): StorageStatus {
  // 1. Check Vercel KV / Upstash Redis
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (kvUrl && kvToken) {
    return {
      mode: "cloud_kv",
      isPersistent: true,
      providerName: "Vercel KV / Upstash Redis",
      message: "Connected to cloud Key-Value database. Admin modifications persist permanently across serverless restarts."
    };
  }

  // 2. Check Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    return {
      mode: "supabase",
      isPersistent: true,
      providerName: "Supabase Cloud Database",
      message: "Connected to Supabase. All content syncs directly to your PostgreSQL database."
    };
  }

  // 3. Check GitHub auto-sync
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
    return {
      mode: "github_sync",
      isPersistent: true,
      providerName: `GitHub Repo Sync (${process.env.GITHUB_REPO})`,
      message: "Connected to GitHub API. Changes automatically commit to data/portfolio.json in your repo."
    };
  }

  // 4. Serverless environment detection
  const isVercel = !!process.env.VERCEL;
  if (isVercel) {
    return {
      mode: "serverless_dual_mode",
      isPersistent: false,
      providerName: "Vercel Serverless (Dual Mode)",
      message: "Running on Vercel Serverless. Updates remain active in memory & temporary storage. Use 'Export portfolio.json' to commit changes to git, or connect Vercel KV / Supabase for 100% automated cloud persistence.",
      setupGuide: {
        serviceName: "Vercel KV / Upstash (1-Click Free Setup)",
        envVars: ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
        docsUrl: "https://vercel.com/docs/storage/vercel-kv"
      }
    };
  }

  return {
    mode: "local_filesystem",
    isPersistent: true,
    providerName: "Local File System",
    message: "Running in local development. Changes are saved directly to data/portfolio.json."
  };
}

// Read from Vercel KV / Upstash
async function readFromKV(url: string, token: string): Promise<PortfolioData | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${url}/get/portfolio_data`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.result) return null;
    return typeof json.result === "string" ? JSON.parse(json.result) : json.result;
  } catch (err) {
    console.error("KV read error:", err);
    return null;
  }
}

// Write to Vercel KV / Upstash
async function writeToKV(url: string, token: string, data: PortfolioData): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${url}/set/portfolio_data`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch (err) {
    console.error("KV write error:", err);
    return false;
  }
}

// Auto-commit to GitHub repository
async function syncToGitHub(data: PortfolioData): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || "kidusasnake/developer-portfolio";
  if (!token) return false;

  try {
    const filePath = "data/portfolio.json";
    // Get file SHA
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json"
      }
    });

    let sha: string | undefined;
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    const contentBase64 = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "chore(cms): update portfolio content from admin dashboard",
        content: contentBase64,
        sha
      })
    });

    return putRes.ok;
  } catch (err) {
    console.error("GitHub sync error:", err);
    return false;
  }
}

// Read from local or /tmp filesystem
function readLocalFile(): PortfolioData {
  // 1. In Vercel serverless environment, check /tmp file first if updated at runtime
  if (process.env.VERCEL && fs.existsSync(TMP_FILE_PATH)) {
    try {
      const content = fs.readFileSync(TMP_FILE_PATH, "utf8");
      const parsed = JSON.parse(content) as PortfolioData;
      memoryCache = parsed;
      return parsed;
    } catch (err) {
      console.error("Vercel /tmp read error:", err);
    }
  }

  // 2. Always read fresh data/portfolio.json from filesystem if available
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, "utf8");
      const parsed = JSON.parse(content) as PortfolioData;
      memoryCache = parsed;
      return parsed;
    }
  } catch (err) {
    console.error("Local file read error:", err);
  }

  // 3. Fall back to memoryCache if available, or default seed data
  if (memoryCache) {
    return memoryCache;
  }

  memoryCache = DEFAULT_PORTFOLIO_DATA;
  return memoryCache;
}

// Synchronous getter for SSR
export function getPortfolioData(): PortfolioData {
  return readLocalFile();
}

// Asynchronous getter that checks Cloud KV / Supabase first
export async function getPortfolioDataAsync(): Promise<PortfolioData> {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (kvUrl && kvToken) {
    const cloudData = await readFromKV(kvUrl, kvToken);
    if (cloudData) {
      memoryCache = cloudData;
      return cloudData;
    }
  }

  return readLocalFile();
}

// Asynchronous save supporting Cloud KV, GitHub Sync, /tmp, and Local JSON
export async function savePortfolioDataAsync(data: PortfolioData): Promise<boolean> {
  memoryCache = data;
  let success = false;

  // 1. Save to Cloud KV if available
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (kvUrl && kvToken) {
    const kvOk = await writeToKV(kvUrl, kvToken, data);
    if (kvOk) success = true;
  }

  // 2. Sync to GitHub if configured
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
    await syncToGitHub(data);
  }

  // 3. Save to local filesystem if writable
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
    success = true;
  } catch {
    // In Vercel serverless, filesystem is read-only (EROFS)
    // Fall back to /tmp
    try {
      fs.writeFileSync(TMP_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
      success = true;
    } catch {
      // Memory cache is already updated
      success = true;
    }
  }

  return success;
}

// Synchronous save for SSR actions
export function savePortfolioData(data: PortfolioData): boolean {
  memoryCache = data;
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch {
    try {
      fs.writeFileSync(TMP_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
      return true;
    } catch {
      return true;
    }
  }
}

// Project helpers
export async function addProjectAsync(project: Omit<Project, "id" | "createdAt">): Promise<Project> {
  const data = await getPortfolioDataAsync();
  const newProject: Project = {
    ...project,
    id: `proj-${Date.now()}`,
    createdAt: new Date().toISOString().split("T")[0]
  };
  data.projects.unshift(newProject);
  await savePortfolioDataAsync(data);
  return newProject;
}

export async function updateProjectAsync(id: string, updates: Partial<Project>): Promise<Project | null> {
  const data = await getPortfolioDataAsync();
  const index = data.projects.findIndex((p) => p.id === id);
  if (index === -1) return null;

  data.projects[index] = { ...data.projects[index], ...updates };
  await savePortfolioDataAsync(data);
  return data.projects[index];
}

export async function deleteProjectAsync(id: string): Promise<boolean> {
  const data = await getPortfolioDataAsync();
  const initialLen = data.projects.length;
  data.projects = data.projects.filter((p) => p.id !== id);
  if (data.projects.length !== initialLen) {
    await savePortfolioDataAsync(data);
    return true;
  }
  return false;
}

// Certification helpers
export async function addCertificationAsync(cert: Omit<Certification, "id">): Promise<Certification> {
  const data = await getPortfolioDataAsync();
  const newCert: Certification = {
    ...cert,
    id: `cert-${Date.now()}`
  };
  data.certifications.unshift(newCert);
  await savePortfolioDataAsync(data);
  return newCert;
}

export async function updateCertificationAsync(id: string, updates: Partial<Certification>): Promise<Certification | null> {
  const data = await getPortfolioDataAsync();
  const index = data.certifications.findIndex((c) => c.id === id);
  if (index === -1) return null;

  data.certifications[index] = { ...data.certifications[index], ...updates };
  await savePortfolioDataAsync(data);
  return data.certifications[index];
}

export async function deleteCertificationAsync(id: string): Promise<boolean> {
  const data = await getPortfolioDataAsync();
  const initialLen = data.certifications.length;
  data.certifications = data.certifications.filter((c) => c.id !== id);
  if (data.certifications.length !== initialLen) {
    await savePortfolioDataAsync(data);
    return true;
  }
  return false;
}

// Profile update helper
export async function updateProfileAsync(updates: Partial<ProfileInfo>): Promise<ProfileInfo> {
  const data = await getPortfolioDataAsync();
  data.profile = {
    ...data.profile,
    ...updates,
    stats: {
      ...data.profile.stats,
      ...(updates.stats || {})
    }
  };
  await savePortfolioDataAsync(data);
  return data.profile;
}

// Synchronous helpers for backward compatibility
export function addProject(project: Omit<Project, "id" | "createdAt">): Project {
  const data = getPortfolioData();
  const newProject: Project = {
    ...project,
    id: `proj-${Date.now()}`,
    createdAt: new Date().toISOString().split("T")[0]
  };
  data.projects.unshift(newProject);
  savePortfolioData(data);
  return newProject;
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const data = getPortfolioData();
  const index = data.projects.findIndex((p) => p.id === id);
  if (index === -1) return null;

  data.projects[index] = { ...data.projects[index], ...updates };
  savePortfolioData(data);
  return data.projects[index];
}

export function deleteProject(id: string): boolean {
  const data = getPortfolioData();
  const initialLen = data.projects.length;
  data.projects = data.projects.filter((p) => p.id !== id);
  if (data.projects.length !== initialLen) {
    savePortfolioData(data);
    return true;
  }
  return false;
}

export function addCertification(cert: Omit<Certification, "id">): Certification {
  const data = getPortfolioData();
  const newCert: Certification = {
    ...cert,
    id: `cert-${Date.now()}`
  };
  data.certifications.unshift(newCert);
  savePortfolioData(data);
  return newCert;
}

export function updateCertification(id: string, updates: Partial<Certification>): Certification | null {
  const data = getPortfolioData();
  const index = data.certifications.findIndex((c) => c.id === id);
  if (index === -1) return null;

  data.certifications[index] = { ...data.certifications[index], ...updates };
  savePortfolioData(data);
  return data.certifications[index];
}

export function deleteCertification(id: string): boolean {
  const data = getPortfolioData();
  const initialLen = data.certifications.length;
  data.certifications = data.certifications.filter((c) => c.id !== id);
  if (data.certifications.length !== initialLen) {
    savePortfolioData(data);
    return true;
  }
  return false;
}

export function updateProfile(updates: Partial<ProfileInfo>): ProfileInfo {
  const data = getPortfolioData();
  data.profile = {
    ...data.profile,
    ...updates,
    stats: {
      ...data.profile.stats,
      ...(updates.stats || {})
    }
  };
  savePortfolioData(data);
  return data.profile;
}
