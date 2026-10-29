"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Shield,
  KeyRound,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  LogOut,
  FolderGit2,
  Award,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  ArrowLeft,
  Upload,
  Download,
  Copy,
  Check,
  Database,
  Server,
  Info,
  ChevronDown,
  ChevronUp,
  FileJson
} from "lucide-react";
import AdminModal, { ModalType } from "@/components/AdminModal";
import { PortfolioData, Project, Certification, ProfileInfo, StorageStatus } from "@/types/portfolio";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  // Active Tab: 'projects' | 'certifications' | 'profile'
  const [activeTab, setActiveTab] = useState<"projects" | "certifications" | "profile">("projects");

  // Portfolio data in Admin
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);
  const [showStorageGuide, setShowStorageGuide] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [selectedItem, setSelectedItem] = useState<Project | Certification | null>(null);

  // Profile Form state
  const [profileForm, setProfileForm] = useState<ProfileInfo | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [res, statusRes] = await Promise.all([
        fetch("/api/portfolio", { cache: "no-store" }),
        fetch("/api/portfolio?action=status", { cache: "no-store" })
      ]);

      if (res.ok) {
        const data = await res.json();
        setPortfolioData(data);
        setProfileForm(data.profile);
      }
      if (statusRes.ok) {
        const status = await statusRes.json();
        setStorageStatus(status);
      }
    } catch (err) {
      console.error("Failed to load portfolio data in admin", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // 1. Check existing session on mount
  useEffect(() => {
    let ignore = false;
    async function verify() {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        if (!ignore) {
          setIsAuthenticated(data.authenticated);
          if (data.authenticated) {
            loadData();
          }
        }
      } catch {
        if (!ignore) {
          setIsAuthenticated(false);
        }
      }
    }
    verify();
    return () => {
      ignore = true;
    };
  }, [loadData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await res.json();

      if (res.ok && data.authenticated) {
        setIsAuthenticated(true);
        loadData();
      } else {
        setAuthError(data.message || "Invalid authentication credentials.");
      }
    } catch {
      setAuthError("Failed to authenticate. Please check server status.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
      setIsAuthenticated(false);
      setPassword("");
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  // Export JSON file
  const handleDownloadJSON = () => {
    if (!portfolioData) return;
    const blob = new Blob([JSON.stringify(portfolioData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setFeedbackMessage({
      type: "success",
      text: "portfolio.json downloaded! You can commit this file to your git repository to make changes permanent."
    });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  // Copy JSON to clipboard
  const handleCopyJSON = () => {
    if (!portfolioData) return;
    navigator.clipboard.writeText(JSON.stringify(portfolioData, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Import JSON file
  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.profile || !Array.isArray(parsed.projects) || !Array.isArray(parsed.certifications)) {
        throw new Error("Invalid portfolio.json file structure.");
      }

      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import_data", payload: parsed })
      });

      if (res.ok) {
        setFeedbackMessage({
          type: "success",
          text: "Successfully imported portfolio configuration! Changes are now live on production."
        });
        setTimeout(() => setFeedbackMessage(null), 4000);
        loadData();
      } else {
        const err = await res.json();
        setFeedbackMessage({ type: "error", text: err.error || "Failed to import portfolio data." });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to parse JSON file.";
      setFeedbackMessage({ type: "error", text: msg });
    }
  };

  // CRUD for Projects
  const handleSaveProject = async (projectData: Partial<Project>, isEdit: boolean) => {
    const action = isEdit ? "update_project" : "add_project";
    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload: projectData })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save project.");
    }

    setFeedbackMessage({
      type: "success",
      text: `Project successfully ${isEdit ? "updated" : "created"}! Changes are live on public landing page.`
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
    loadData();
  };

  // CRUD for Certifications
  const handleSaveCertification = async (certData: Partial<Certification>, isEdit: boolean) => {
    const action = isEdit ? "update_certification" : "add_certification";
    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload: certData })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save certification.");
    }

    setFeedbackMessage({
      type: "success",
      text: `Certification successfully ${isEdit ? "updated" : "registered"}! Changes are live on public landing page.`
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
    loadData();
  };

  // Deletion
  const handleConfirmDelete = async (id: string, type: "project" | "certification") => {
    const action = type === "project" ? "delete_project" : "delete_certification";
    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload: { id } })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete item.");
    }

    setFeedbackMessage({
      type: "success",
      text: `${type === "project" ? "Project" : "Certification"} deleted successfully!`
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
    loadData();
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm) return;

    setSavingProfile(true);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_profile", payload: profileForm })
      });

      if (res.ok) {
        setFeedbackMessage({
          type: "success",
          text: "Profile settings updated successfully! Live on public portfolio."
        });
        setTimeout(() => setFeedbackMessage(null), 4000);
        loadData();
      } else {
        const err = await res.json();
        setFeedbackMessage({ type: "error", text: err.error || "Failed to update profile." });
      }
    } catch {
      setFeedbackMessage({ type: "error", text: "Network error saving profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  // Profile Avatar Upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileForm) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (res.ok && data.url) {
        setProfileForm({ ...profileForm, avatar: data.url });
        setFeedbackMessage({ type: "success", text: "Profile image uploaded!" });
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (err) {
      console.error("Avatar upload error", err);
    }
  };

  // Modal Openers
  const openNewProject = () => {
    setSelectedItem(null);
    setModalType("project");
    setModalOpen(true);
  };

  const openEditProject = (project: Project) => {
    setSelectedItem(project);
    setModalType("project");
    setModalOpen(true);
  };

  const openDeleteProject = (project: Project) => {
    setSelectedItem(project);
    setModalType("delete_project");
    setModalOpen(true);
  };

  const openNewCertification = () => {
    setSelectedItem(null);
    setModalType("certification");
    setModalOpen(true);
  };

  const openEditCertification = (cert: Certification) => {
    setSelectedItem(cert);
    setModalType("certification");
    setModalOpen(true);
  };

  const openDeleteCertification = (cert: Certification) => {
    setSelectedItem(cert);
    setModalType("delete_certification");
    setModalOpen(true);
  };

  // Loading Session State
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Verifying session...</span>
        </div>
      </div>
    );
  }

  // 2. LOGIN FORM VIEW
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Glows */}
        <div className="ambient-glow w-96 h-96 top-10 left-1/4 bg-indigo-600/30" />
        <div className="ambient-glow w-96 h-96 bottom-10 right-1/4 bg-cyan-600/20" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Public Portfolio</span>
            </Link>

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 p-0.5 mx-auto mb-4 shadow-lg shadow-indigo-500/25">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400">
                <Shield className="w-7 h-7" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight">CMS Admin Portal</h1>
            <p className="text-xs text-slate-400 mt-1">
              Enter your master password (or Vercel ADMIN_PASSWORD) to manage your portfolio content.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl">
            {authError && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Master Password / PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Enter password (default: admin123)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
              >
                {loading ? "Authenticating..." : "Unlock Dashboard"}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
              <span className="text-[11px] text-slate-500 font-mono">
                Default: <code className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded">admin123</code> • Customize via <code className="text-indigo-400">ADMIN_PASSWORD</code>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. AUTHENTICATED DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 py-3.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-base flex items-center gap-2">
                Portfolio CMS Dashboard
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  storageStatus?.isPersistent
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                }`}>
                  {storageStatus?.providerName || "Serverless Ready"}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Connected to <span className="text-indigo-400 font-mono">kidusasnake.pro.et</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            {/* Download JSON Button */}
            <button
              onClick={handleDownloadJSON}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
              title="Download updated portfolio.json file to commit to git"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export JSON</span>
            </button>

            {/* Copy JSON Button */}
            <button
              onClick={handleCopyJSON}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Copy portfolio JSON to clipboard"
            >
              {copySuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>

            {/* Import JSON */}
            <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors">
              <FileJson className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportJSON}
              />
            </label>

            {/* View Live Public Site */}
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-800/50 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Site</span>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Instant Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-center gap-2.5 text-sm animate-in fade-in duration-200 ${
              feedbackMessage.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border border-red-500/30 text-red-400"
            }`}
          >
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="font-medium">{feedbackMessage.text}</span>
          </div>
        )}

        {/* Persistence Status & Dual Mode Banner */}
        <div className="mb-8 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-2xl shrink-0 ${
                storageStatus?.isPersistent
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
              }`}>
                {storageStatus?.isPersistent ? <Database className="w-5 h-5" /> : <Server className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    Storage Persistence: {storageStatus?.providerName}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    storageStatus?.isPersistent
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}>
                    {storageStatus?.isPersistent ? "Automated Cloud DB" : "Dual Mode Active"}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {storageStatus?.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setShowStorageGuide(!showStorageGuide)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>{showStorageGuide ? "Hide Setup Guide" : "Cloud DB Setup"}</span>
                {showStorageGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Collapsible Cloud DB Setup Guide */}
          {showStorageGuide && (
            <div className="mt-5 pt-5 border-t border-slate-800 text-xs text-slate-300 animate-in fade-in duration-200 space-y-4">
              <p className="font-semibold text-white">
                How to enable 100% automated cloud database persistence on Vercel:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vercel KV / Upstash Card */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="font-bold text-cyan-400 flex items-center justify-between">
                    <span>Option A: Vercel KV / Upstash (Recommended)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">1-Click Free</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    In your Vercel Project Dashboard, click <strong>Storage</strong> → <strong>Create KV Database</strong> → <strong>Connect</strong>.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Vercel automatically populates:
                  </p>
                  <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-indigo-300 font-mono">
                    KV_REST_API_URL=&quot;https://...&quot;&#10;KV_REST_API_TOKEN=&quot;...&quot;
                  </pre>
                </div>

                {/* GitHub Auto-Commit Card */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="font-bold text-emerald-400 flex items-center justify-between">
                    <span>Option B: GitHub Auto-Commit Sync</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">Zero DB</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Add a GitHub Personal Access Token to your Vercel Environment Variables. Every admin save will commit directly to git:
                  </p>
                  <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-emerald-300 font-mono">
                    GITHUB_TOKEN=&quot;ghp_...&quot;&#10;GITHUB_REPO=&quot;kidusasnake/developer-portfolio&quot;
                  </pre>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-900/50 text-[11px] text-indigo-200">
                💡 <strong>Dual Mode Tip:</strong> You don&apos;t need any external database right now! Simply edit your portfolio in this dashboard, click <strong>&ldquo;Export JSON&rdquo;</strong>, replace <code className="bg-slate-900 px-1 py-0.5 rounded">data/portfolio.json</code>, and run <code className="bg-slate-900 px-1 py-0.5 rounded">git push origin main</code>.
              </div>
            </div>
          )}
        </div>

        {/* Tab Controls & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "projects"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Projects ({portfolioData?.projects.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("certifications")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "certifications"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Certifications & Badges ({portfolioData?.certifications.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "profile"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Profile & Hero Config</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-cyan-400" : ""}`} />
            </button>

            {activeTab === "projects" && (
              <button
                onClick={openNewProject}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Project</span>
              </button>
            )}

            {activeTab === "certifications" && (
              <button
                onClick={openNewCertification}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Certification Badge</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: PROJECTS TABLE & MANAGER */}
        {activeTab === "projects" && (
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Manage Projects</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Add, update, or remove portfolio showcase projects. Changes render instantly on the landing page.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Preview</th>
                    <th className="px-6 py-4">Title & Description</th>
                    <th className="px-6 py-4">Tags</th>
                    <th className="px-6 py-4">Role & Metrics</th>
                    <th className="px-6 py-4">Links</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {portfolioData?.projects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-16 h-10 rounded-lg bg-slate-950 overflow-hidden border border-slate-800 shrink-0">
                          <img
                            src={proj.imageUrl}
                            alt={proj.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          {proj.title}
                          {proj.featured && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs truncate mt-0.5">
                          {proj.description}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {proj.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]"
                            >
                              {tag}
                            </span>
                          ))}
                          {proj.tags.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-850 text-slate-400 text-[10px]">
                              +{proj.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-300 font-medium">{proj.role || "—"}</div>
                        <div className="text-cyan-400 font-mono text-[11px] mt-0.5">
                          {proj.metrics || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {proj.liveUrl && (
                            <a
                              href={proj.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-cyan-950/50 text-cyan-400 hover:text-cyan-300 border border-cyan-800/40"
                              title="Live Demo"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {proj.repoUrl && (
                            <a
                              href={proj.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                              title="Source Repo"
                            >
                              <FolderGit2 className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditProject(proj)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors"
                            title="Edit Project"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteProject(proj)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Delete Project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CERTIFICATIONS & BADGES MANAGER */}
        {activeTab === "certifications" && (
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Manage Certifications & Badges</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Upload badge images, register credential IDs, and provide official verification links.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Badge</th>
                    <th className="px-6 py-4">Title & Issuer</th>
                    <th className="px-6 py-4">Credential ID</th>
                    <th className="px-6 py-4">Validity</th>
                    <th className="px-6 py-4">Skills</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {portfolioData?.certifications.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-950 p-1 border border-slate-800 flex items-center justify-center shrink-0">
                          <img
                            src={cert.badgeUrl}
                            alt={cert.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="font-bold text-white text-sm">{cert.title}</div>
                        <div className="text-cyan-400 text-xs mt-0.5">{cert.issuer}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[11px]">
                          {cert.credentialId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-300">Issued: {cert.issueDate}</div>
                        <div className="text-slate-500 text-[11px]">Exp: {cert.expiryDate || "Lifetime"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {cert.skills.slice(0, 2).map((s) => (
                            <span key={s} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                              {s}
                            </span>
                          ))}
                          {cert.skills.length > 2 && (
                            <span className="text-[10px] text-slate-500">+{cert.skills.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={cert.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-emerald-950/40 text-emerald-400 hover:text-emerald-300 border border-emerald-800/40 transition-colors"
                            title="Verify on Issuer Website"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => openEditCertification(cert)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors"
                            title="Edit Certification"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteCertification(cert)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Delete Certification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PROFILE & HERO CONFIG */}
        {activeTab === "profile" && profileForm && (
          <div className="glass-panel rounded-3xl border border-slate-800 p-8 shadow-2xl max-w-4xl mx-auto">
            <div className="mb-8 pb-6 border-b border-slate-800">
              <h2 className="text-2xl font-bold text-white">Portfolio Profile & Hero Configuration</h2>
              <p className="text-xs text-slate-400 mt-1">
                Customize your name, headline, bio, resume link, contact email, and dynamic hero statistics.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Profile Image & Basic Info */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-500/40 shrink-0">
                  <img
                    src={profileForm.avatar}
                    alt={profileForm.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 w-full space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Profile Avatar URL or Upload
                    </label>
                    <input
                      type="text"
                      value={profileForm.avatar}
                      onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors">
                      <Upload className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Upload Avatar Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Professional Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.title}
                    onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Hero Headline *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.headline}
                  onChange={(e) => setProfileForm({ ...profileForm, headline: e.target.value })}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Hero Bio / Value Proposition *
                </label>
                <textarea
                  rows={4}
                  required
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-sm text-white leading-relaxed"
                />
              </div>

              {/* Dynamic Stats Row */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                  Hero Metrics & Statistics
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">Years Experience</span>
                    <input
                      type="text"
                      value={profileForm.stats.yearsExperience}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          stats: { ...profileForm.stats, yearsExperience: e.target.value }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white font-bold"
                    />
                  </div>
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">Projects Shipped</span>
                    <input
                      type="text"
                      value={profileForm.stats.projectsShipped}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          stats: { ...profileForm.stats, projectsShipped: e.target.value }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white font-bold"
                    />
                  </div>
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">Verified Certs</span>
                    <input
                      type="text"
                      value={profileForm.stats.certificationsVerified}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          stats: { ...profileForm.stats, certificationsVerified: e.target.value }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white font-bold"
                    />
                  </div>
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">GitHub Commits</span>
                    <input
                      type="text"
                      value={profileForm.stats.githubContributions}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          stats: { ...profileForm.stats, githubContributions: e.target.value }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Resume & Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Resume Document URL
                  </label>
                  <input
                    type="text"
                    value={profileForm.resumeUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, resumeUrl: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Contact Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={profileForm.github}
                    onChange={(e) => setProfileForm({ ...profileForm, github: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={profileForm.linkedin}
                    onChange={(e) => setProfileForm({ ...profileForm, linkedin: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="availableToggle"
                  checked={profileForm.availableForWork}
                  onChange={(e) => setProfileForm({ ...profileForm, availableForWork: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <label htmlFor="availableToggle" className="text-xs font-medium text-slate-300">
                  Mark as Available for Work (Shows green pulsing badge in hero and navbar)
                </label>
              </div>

              <div className="pt-6 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
                >
                  {savingProfile ? "Saving Profile Changes..." : "Publish Profile Updates"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Reusable Admin Modal for Project / Certification CRUD */}
      {modalOpen && (
        <AdminModal
          key={`${modalType}-${selectedItem && "id" in selectedItem ? selectedItem.id : "new"}`}
          isOpen={modalOpen}
          type={modalType}
          itemToEdit={selectedItem}
          onClose={() => setModalOpen(false)}
          onSaveProject={handleSaveProject}
          onSaveCertification={handleSaveCertification}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
    </div>
  );
}
