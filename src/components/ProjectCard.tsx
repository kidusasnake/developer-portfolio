"use client";

import React, { useState } from "react";
import { ExternalLink, Sparkles, ChevronDown, ChevronUp, Layers } from "lucide-react";
import { GithubIcon } from "@/components/SocialIcons";
import { Project } from "@/types/portfolio";

interface ProjectCardProps {
  project: Project;
  onTagClick?: (tag: string) => void;
  selectedTag?: string;
}

export default function ProjectCard({ project, onTagClick, selectedTag }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl overflow-hidden flex flex-col border border-slate-800/80 bg-slate-900/60 transition-all duration-300">
      {/* Project Image & Overlay */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950 group">
        <img
          src={project.imageUrl || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80"}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />

        {/* Featured Badge */}
        {project.featured && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/80 text-white text-xs font-semibold backdrop-blur-md shadow-md shadow-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Featured Project</span>
          </div>
        )}

        {/* Role or Metrics badge */}
        {project.metrics && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[11px] font-mono text-cyan-400 backdrop-blur-md">
            {project.metrics}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors">
              {project.title}
            </h3>
          </div>

          {project.role && (
            <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5 mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>{project.role}</span>
            </div>
          )}

          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {project.description}
          </p>

          {/* Collapsible Deep-Dive Details */}
          {project.longDescription && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <span>{expanded ? "Show less architecture details" : "View architecture & implementation"}</span>
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {expanded && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed animate-in fade-in duration-200">
                  {project.longDescription}
                </div>
              )}
            </div>
          )}

          {/* Tech Tag Pills */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {project.tags.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagClick && onTagClick(tag)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                    isSelected
                      ? "bg-indigo-500 text-white font-semibold shadow-sm shadow-indigo-500/30"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Links to Repo & Live Deployment */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 px-3 py-2 rounded-lg border border-slate-700/60 transition-colors"
              >
                <GithubIcon className="w-4 h-4" />
                <span>Source</span>
              </a>
            )}

            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 hover:bg-cyan-900/50 px-3.5 py-2 rounded-lg border border-cyan-800/50 transition-colors"
              >
                <span>Live Demo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            {project.createdAt}
          </span>
        </div>
      </div>
    </div>
  );
}
