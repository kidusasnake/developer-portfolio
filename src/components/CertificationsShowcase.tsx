"use client";

import React, { useState } from "react";
import { Award, ShieldCheck, X, ExternalLink } from "lucide-react";
import CertCard from "./CertCard";
import { Certification } from "@/types/portfolio";

interface CertificationsShowcaseProps {
  certifications: Certification[];
}

export default function CertificationsShowcase({ certifications }: CertificationsShowcaseProps) {
  const [activeModalCert, setActiveModalCert] = useState<Certification | null>(null);

  return (
    <section id="certifications" className="py-24 relative bg-slate-950/40 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Accreditations & Credentials</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Certifications & Badges
            </h2>
            <p className="text-slate-400 text-base mt-2 max-w-xl">
              Industry-recognized credentials verifying expertise in cloud architecture, container orchestration, IaC, and modern engineering standards.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800 self-start md:self-auto flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>{certifications.length} Verified Credentials</span>
          </div>
        </div>

        {/* Certifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {certifications.map((cert) => (
            <CertCard
              key={cert.id}
              cert={cert}
              onPreviewBadge={(c) => setActiveModalCert(c)}
            />
          ))}
        </div>

        {/* Badge Preview Modal */}
        {activeModalCert && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setActiveModalCert(null)}
          >
            <div
              className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-8 shadow-2xl flex flex-col items-center text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setActiveModalCert(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-32 h-32 rounded-2xl bg-slate-950 p-4 border border-slate-750 shadow-inner flex items-center justify-center mb-6">
                <img
                  src={activeModalCert.badgeUrl}
                  alt={activeModalCert.title}
                  className="w-full h-full object-contain"
                />
              </div>

              <h3 className="text-xl font-bold text-white mb-1">{activeModalCert.title}</h3>
              <p className="text-sm font-semibold text-cyan-400 mb-2">{activeModalCert.issuer}</p>

              <p className="text-xs text-slate-400 mb-4 font-mono">
                Credential ID: {activeModalCert.credentialId}
              </p>

              <div className="flex flex-wrap justify-center gap-1.5 mb-6">
                {activeModalCert.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <a
                href={activeModalCert.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all"
              >
                <span>Verify on Official Issuer Website</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
