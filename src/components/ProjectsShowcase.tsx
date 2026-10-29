"use client";

import React, { useState, useMemo } from "react";
import { Search, FolderGit2, Filter } from "lucide-react";
import ProjectCard from "./ProjectCard";
import { Project } from "@/types/portfolio";

interface ProjectsShowcaseProps {
  initialProjects: Project[];
}

export default function ProjectsShowcase({ initialProjects }: ProjectsShowcaseProps) {
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Collect all unique tags sorted by popularity
  const allTags = useMemo(() => {
    const counts: Record<string, number> = {};
    initialProjects.forEach((p) => {
      p.tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });

    const uniqueTags = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return ["All", ...uniqueTags];
  }, [initialProjects]);

  // Filter projects by tag and search query
  const filteredProjects = useMemo(() => {
    return initialProjects.filter((project) => {
      const matchesTag =
        selectedTag === "All" ||
        project.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.tags.some((t) => t.toLowerCase().includes(query));

      return matchesTag && matchesSearch;
    });
  }, [initialProjects, selectedTag, searchQuery]);

  return (
    <section id="projects" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Production Work & Open Source</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Featured Projects
            </h2>
            <p className="text-slate-400 text-base mt-2 max-w-xl">
              Production systems, developer tools, and scalable distributed applications with live previews and open repositories.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800 self-start md:self-auto">
            Showing <span className="text-cyan-400 font-bold">{filteredProjects.length}</span> of {initialProjects.length} projects
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-md mb-10 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Tech Tag Pills Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none max-w-full md:max-w-3xl">
            <Filter className="w-4 h-4 text-slate-500 shrink-0 ml-1 mr-1" />
            {allTags.map((tag) => {
              const isActive = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`text-xs px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all font-medium ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold shadow-md shadow-indigo-500/20"
                      : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative shrink-0 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                selectedTag={selectedTag}
                onTagClick={(tag) => setSelectedTag(tag)}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60">
            <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-slate-300 mb-1">No matching projects found</h4>
            <p className="text-xs text-slate-500 mb-4">
              Try adjusting your search query or selecting a different tech tag.
            </p>
            <button
              onClick={() => {
                setSelectedTag("All");
                setSearchQuery("");
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
