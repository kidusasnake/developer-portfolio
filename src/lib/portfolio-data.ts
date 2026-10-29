import fs from "fs";
import path from "path";
import { PortfolioData, Project, Certification, ProfileInfo } from "@/types/portfolio";

const DATA_FILE_PATH = path.join(process.cwd(), "data", "portfolio.json");

// Default fallback data if file doesn't exist
const DEFAULT_PORTFOLIO_DATA: PortfolioData = {
  profile: {
    name: "Alex Rivera",
    title: "Senior Full-Stack & Cloud Architect",
    headline: "Building resilient cloud systems & high-converting modern web applications.",
    bio: "Senior Software Engineer with 6+ years of expertise spanning Next.js, TypeScript, distributed microservices, and multi-cloud architectures. Passionate about performant developer tools, accessible UI design, and cloud-native solutions.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    resumeUrl: "/resume.pdf",
    location: "San Francisco, CA (Open to Remote)",
    email: "alex.rivera.dev@gmail.com",
    github: "https://github.com",
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

// Ensure data folder and file exists
function ensureDataFile(): void {
  const dir = path.dirname(DATA_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE_PATH)) {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(DEFAULT_PORTFOLIO_DATA, null, 2), "utf8");
  }
}

export function getPortfolioData(): PortfolioData {
  try {
    ensureDataFile();
    const content = fs.readFileSync(DATA_FILE_PATH, "utf8");
    return JSON.parse(content) as PortfolioData;
  } catch (err) {
    console.error("Error reading portfolio data:", err);
    return DEFAULT_PORTFOLIO_DATA;
  }
}

export function savePortfolioData(data: PortfolioData): boolean {
  try {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing portfolio data:", err);
    return false;
  }
}

// Project helpers
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

// Certification helpers
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

// Profile update helper
export function updateProfile(updates: Partial<ProfileInfo>): ProfileInfo {
  const data = getPortfolioData();
  data.profile = { ...data.profile, ...updates };
  savePortfolioData(data);
  return data.profile;
}
