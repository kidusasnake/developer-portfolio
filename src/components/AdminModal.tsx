"use client";

import React, { useState } from "react";
import { X, Upload, AlertCircle, Image as ImageIcon, Loader2 } from "lucide-react";
import { Project, Certification } from "@/types/portfolio";

export type ModalType = "project" | "certification" | "delete_project" | "delete_certification";

interface AdminModalProps {
  isOpen: boolean;
  type: ModalType | null;
  itemToEdit?: Project | Certification | null;
  onClose: () => void;
  onSaveProject: (projectData: Partial<Project>, isEdit: boolean) => Promise<void>;
  onSaveCertification: (certData: Partial<Certification>, isEdit: boolean) => Promise<void>;
  onConfirmDelete: (id: string, type: "project" | "certification") => Promise<void>;
}

export default function AdminModal({
  isOpen,
  type,
  itemToEdit,
  onClose,
  onSaveProject,
  onSaveCertification,
  onConfirmDelete
}: AdminModalProps) {
  // Project Form State
  const [projectForm, setProjectForm] = useState(() => {
    if (type === "project" && itemToEdit) {
      const p = itemToEdit as Project;
      return {
        title: p.title || "",
        description: p.description || "",
        longDescription: p.longDescription || "",
        tags: p.tags ? p.tags.join(", ") : "",
        repoUrl: p.repoUrl || "",
        liveUrl: p.liveUrl || "",
        imageUrl: p.imageUrl || "",
        featured: !!p.featured,
        role: p.role || "",
        metrics: p.metrics || ""
      };
    }
    return {
      title: "",
      description: "",
      longDescription: "",
      tags: "Next.js, TypeScript, Tailwind CSS",
      repoUrl: "",
      liveUrl: "",
      imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
      featured: false,
      role: "Full-Stack Engineer",
      metrics: ""
    };
  });

  // Certification Form State
  const [certForm, setCertForm] = useState(() => {
    if (type === "certification" && itemToEdit) {
      const c = itemToEdit as Certification;
      return {
        title: c.title || "",
        issuer: c.issuer || "",
        issueDate: c.issueDate || "",
        expiryDate: c.expiryDate || "",
        credentialId: c.credentialId || "",
        verificationUrl: c.verificationUrl || "",
        badgeUrl: c.badgeUrl || "",
        skills: c.skills ? c.skills.join(", ") : ""
      };
    }
    return {
      title: "",
      issuer: "",
      issueDate: "2024",
      expiryDate: "2027",
      credentialId: "",
      verificationUrl: "https://",
      badgeUrl: "/badges/aws-architect.svg",
      skills: "Cloud Architecture, Security, Systems Design"
    };
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    setErrorMessage(null);
    setUploadError(null);
    onClose();
  };

  if (!isOpen || !type) return null;

  // Handle Badge or Project Image File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: "badgeUrl" | "imageUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (res.ok && data.url) {
        if (targetField === "badgeUrl") {
          setCertForm((prev) => ({ ...prev, badgeUrl: data.url }));
        } else {
          setProjectForm((prev) => ({ ...prev, imageUrl: data.url }));
        }
      } else {
        setUploadError(data.error || "File upload failed.");
      }
    } catch {
      setUploadError("Network error while uploading file.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (type === "project") {
        const payload: Partial<Project> = {
          title: projectForm.title,
          description: projectForm.description,
          longDescription: projectForm.longDescription,
          tags: projectForm.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          repoUrl: projectForm.repoUrl,
          liveUrl: projectForm.liveUrl,
          imageUrl: projectForm.imageUrl,
          featured: projectForm.featured,
          role: projectForm.role,
          metrics: projectForm.metrics
        };
        if (itemToEdit) {
          payload.id = (itemToEdit as Project).id;
        }
        await onSaveProject(payload, !!itemToEdit);
        handleClose();
      } else if (type === "certification") {
        const payload: Partial<Certification> = {
          title: certForm.title,
          issuer: certForm.issuer,
          issueDate: certForm.issueDate,
          expiryDate: certForm.expiryDate,
          credentialId: certForm.credentialId,
          verificationUrl: certForm.verificationUrl,
          badgeUrl: certForm.badgeUrl,
          skills: certForm.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        };
        if (itemToEdit) {
          payload.id = (itemToEdit as Certification).id;
        }
        await onSaveCertification(payload, !!itemToEdit);
        handleClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save item.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToEdit) return;
    setIsSubmitting(true);
    try {
      if (type === "delete_project") {
        await onConfirmDelete((itemToEdit as Project).id, "project");
      } else if (type === "delete_certification") {
        await onConfirmDelete((itemToEdit as Certification).id, "certification");
      }
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete item.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-750 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {(type === "delete_project" || type === "delete_certification") && (
          <div className="py-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Confirm Deletion</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto mb-6">
              Are you sure you want to permanently delete &ldquo;
              <span className="font-semibold text-white">
                {(itemToEdit && "title" in itemToEdit) ? itemToEdit.title : ""}
              </span>
              &rdquo;? This will immediately remove it from the public portfolio.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDelete}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold shadow-lg shadow-red-600/30 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        )}

        {/* PROJECT FORM MODAL */}
        {type === "project" && (
          <div>
            <div className="mb-6">
              <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400">
                {itemToEdit ? "Edit Project" : "Create New Project"}
              </span>
              <h3 className="text-2xl font-bold text-white mt-1">
                {itemToEdit ? "Update Project Details" : "Add Project to Portfolio"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., OmniFlow AI Engine"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Your Role / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Lead Architect / Core Maintainer"
                    value={projectForm.role}
                    onChange={(e) => setProjectForm({ ...projectForm, role: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Key Metric / Badge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 140k req/min peak"
                    value={projectForm.metrics}
                    onChange={(e) => setProjectForm({ ...projectForm, metrics: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Short Description *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Brief summary shown on the public project card..."
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Architecture & Implementation Details (Optional, expandable)
                </label>
                <textarea
                  rows={3}
                  placeholder="In-depth details on algorithms, latency improvements, stack considerations..."
                  value={projectForm.longDescription}
                  onChange={(e) => setProjectForm({ ...projectForm, longDescription: e.target.value })}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tech Tags (Comma separated) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Next.js, TypeScript, Tailwind CSS, Docker"
                  value={projectForm.tags}
                  onChange={(e) => setProjectForm({ ...projectForm, tags: e.target.value })}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    GitHub / Source Repo URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={projectForm.repoUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, repoUrl: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Live Demo URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://my-app.vercel.app"
                    value={projectForm.liveUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, liveUrl: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Project Image & Upload */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Project Screenshot / Preview Image
                </label>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <div className="w-24 h-16 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {projectForm.imageUrl ? (
                      <img
                        src={projectForm.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      placeholder="Image URL or upload a file below"
                      value={projectForm.imageUrl}
                      onChange={(e) => setProjectForm({ ...projectForm, imageUrl: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors">
                        <Upload className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{uploading ? "Uploading..." : "Upload Screenshot"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => handleFileUpload(e, "imageUrl")}
                        />
                      </label>
                      {uploading && <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />}
                    </div>
                  </div>
                </div>
                {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featuredToggle"
                  checked={projectForm.featured}
                  onChange={(e) => setProjectForm({ ...projectForm, featured: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="featuredToggle" className="text-xs font-medium text-slate-300">
                  Highlight as Featured Project (displays glow badge on landing page)
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : itemToEdit ? "Update Project" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CERTIFICATION FORM MODAL */}
        {type === "certification" && (
          <div>
            <div className="mb-6">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
                {itemToEdit ? "Edit Credential" : "Add Certification"}
              </span>
              <h3 className="text-2xl font-bold text-white mt-1">
                {itemToEdit ? "Update Certification" : "Register Verified Badge"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Certification Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., AWS Certified Solutions Architect – Professional"
                  value={certForm.title}
                  onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Issuing Organization *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Amazon Web Services (AWS)"
                    value={certForm.issuer}
                    onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Credential ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., AWS-PSA-9482104"
                    value={certForm.credentialId}
                    onChange={(e) => setCertForm({ ...certForm, credentialId: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Issue Date *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Jan 2024"
                    value={certForm.issueDate}
                    onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Expiry Date (or Lifetime)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Jan 2027 or Lifetime Credential"
                    value={certForm.expiryDate}
                    onChange={(e) => setCertForm({ ...certForm, expiryDate: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Verification URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://aws.amazon.com/verification"
                  value={certForm.verificationUrl}
                  onChange={(e) => setCertForm({ ...certForm, verificationUrl: e.target.value })}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Badge Image Upload & Preview */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Badge Logo / Image (Upload file or enter URL) *
                </label>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center p-1.5">
                    {certForm.badgeUrl ? (
                      <img
                        src={certForm.badgeUrl}
                        alt="Badge Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      required
                      placeholder="/badges/aws-architect.svg or uploaded file path"
                      value={certForm.badgeUrl}
                      onChange={(e) => setCertForm({ ...certForm, badgeUrl: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-medium border border-emerald-500/40 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploading ? "Uploading Badge..." : "Upload Badge Image"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => handleFileUpload(e, "badgeUrl")}
                        />
                      </label>
                      {uploading && <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />}
                    </div>
                  </div>
                </div>
                {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Verified Skills (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Cloud Architecture, Cost Optimization, IAM, Security"
                  value={certForm.skills}
                  onChange={(e) => setCertForm({ ...certForm, skills: e.target.value })}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-semibold shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : itemToEdit ? "Update Credential" : "Add Credential"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
