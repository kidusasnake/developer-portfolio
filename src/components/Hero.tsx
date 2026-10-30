"use client";

import React from "react";
import { Download, ArrowRight, Sparkles, CheckCircle2, Award, Briefcase, GitBranch } from "lucide-react";
import { ProfileInfo } from "@/types/portfolio";

interface HeroProps {
  profile: ProfileInfo;
}

function renderHeadline(headline: string) {
  if (!headline) {
    return (
      <>
        Engineering scalable{" "}
        <span className="glow-gradient-text">cloud systems</span> & reactive web applications.
      </>
    );
  }

  // If user used & in headline, highlight the second part with gradient
  if (headline.includes("&")) {
    const parts = headline.split("&");
    return (
      <>
        {parts[0].trim()}{" "}
        <span className="glow-gradient-text">&amp; {parts.slice(1).join("&").trim()}</span>
      </>
    );
  }

  // If headline has multiple words, highlight the second half with gradient
  const words = headline.trim().split(/\s+/);
  if (words.length > 3) {
    const mid = Math.ceil(words.length / 2);
    return (
      <>
        {words.slice(0, mid).join(" ")}{" "}
        <span className="glow-gradient-text">{words.slice(mid).join(" ")}</span>
      </>
    );
  }

  return <span className="glow-gradient-text">{headline}</span>;
}

export default function Hero({ profile }: HeroProps) {
  return (
    <section id="about" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Ambient background glows */}
      <div className="ambient-glow w-96 h-96 -top-20 left-1/4 bg-indigo-600" />
      <div className="ambient-glow w-[32rem] h-[32rem] top-40 right-10 bg-cyan-600" />
      <div className="ambient-glow w-72 h-72 -bottom-10 left-10 bg-purple-700" />

      {/* Subtle grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Text & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start">
            {/* Availability Pill */}
            {profile.availableForWork && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6 shadow-sm shadow-emerald-500/10 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Available for Full-time Roles & High-Impact Contracts</span>
              </div>
            )}

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] mb-6">
              {renderHeadline(profile.headline)}
            </h1>

            {/* Value Proposition & Bio */}
            <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl font-normal">
              {profile.bio}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto mb-12">
              <a
                href={profile.resumeUrl}
                download={`${(profile.name || "Resume").replace(/\s+/g, "_")}_Resume.pdf`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                <span>Download Resume</span>
              </a>

              <a
                href="#projects"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-sm border border-slate-700/80 hover:border-slate-600 transition-all duration-200"
              >
                <span>View Projects</span>
                <ArrowRight className="w-4 h-4 text-cyan-400" />
              </a>

              <a
                href="#contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-900 text-slate-300 hover:text-white font-medium text-sm border border-slate-800 hover:border-slate-700 transition-all duration-200"
              >
                <span>Get in Touch</span>
              </a>
            </div>

            {/* Core Tech Stack Badges */}
            <div className="pt-6 border-t border-slate-800/80 w-full">
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Primary Core Technologies
              </div>
              <div className="flex flex-wrap gap-2">
                {["Next.js 15+", "TypeScript", "React", "Node.js", "Docker", "Kubernetes", "AWS Cloud", "Tailwind CSS", "Go", "PostgreSQL"].map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300 hover:border-indigo-500/40 hover:text-white transition-colors"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Profile Card & Dynamic Stats */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-end">
            <div className="relative w-full max-w-md">
              {/* Profile Image & Glass Container */}
              <div className="relative rounded-3xl p-6 glass-panel border border-slate-700/60 shadow-2xl overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />

                <div className="flex items-center gap-4 mb-6">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-500/40 shadow-inner shrink-0">
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-1.5">
                      {profile.name}
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    </h3>
                    <p className="text-sm text-cyan-400 font-medium">{profile.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{profile.location}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 mb-6 leading-relaxed">
                  &ldquo;{profile.headline}&rdquo;
                </p>

                {/* Dynamic Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-2 text-indigo-400 mb-1">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-xs font-semibold text-slate-400">Experience</span>
                    </div>
                    <div className="text-2xl font-extrabold text-white">
                      {profile.stats.yearsExperience}
                    </div>
                  </div>

                  <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-2 text-cyan-400 mb-1">
                      <GitBranch className="w-4 h-4" />
                      <span className="text-xs font-semibold text-slate-400">Shipped</span>
                    </div>
                    <div className="text-2xl font-extrabold text-white">
                      {profile.stats.projectsShipped}
                    </div>
                  </div>

                  <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                      <Award className="w-4 h-4" />
                      <span className="text-xs font-semibold text-slate-400">Verified Certs</span>
                    </div>
                    <div className="text-2xl font-extrabold text-white">
                      {profile.stats.certificationsVerified}
                    </div>
                  </div>

                  <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-2 text-purple-400 mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-semibold text-slate-400">Git Commits</span>
                    </div>
                    <div className="text-2xl font-extrabold text-white">
                      {profile.stats.githubContributions}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
