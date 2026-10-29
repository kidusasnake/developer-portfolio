export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  tags: string[];
  repoUrl?: string;
  liveUrl?: string;
  imageUrl: string;
  featured?: boolean;
  role?: string;
  metrics?: string;
  createdAt: string;
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId: string;
  verificationUrl: string;
  badgeUrl: string;
  skills: string[];
}

export interface ProfileStats {
  yearsExperience: string;
  projectsShipped: string;
  certificationsVerified: string;
  githubContributions: string;
}

export interface ProfileInfo {
  name: string;
  title: string;
  headline: string;
  bio: string;
  avatar: string;
  resumeUrl: string;
  location: string;
  email: string;
  github: string;
  linkedin: string;
  twitter?: string;
  availableForWork: boolean;
  stats: ProfileStats;
}

export interface PortfolioData {
  profile: ProfileInfo;
  projects: Project[];
  certifications: Certification[];
}
