"use client";

import React, { useState } from "react";
import { ExternalLink, Copy, Check, ShieldCheck, Calendar, KeyRound } from "lucide-react";
import { Certification } from "@/types/portfolio";

interface CertCardProps {
  cert: Certification;
  onPreviewBadge?: (cert: Certification) => void;
}

export default function CertCard({ cert, onPreviewBadge }: CertCardProps) {
  const [copied, setCopied] = useState(false);

  const copyCredentialId = () => {
    navigator.clipboard.writeText(cert.credentialId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-6 border border-slate-800/80 bg-slate-900/60 flex flex-col justify-between transition-all duration-300">
      <div>
        {/* Top Header: Badge Image & Verified Status */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div
            onClick={() => onPreviewBadge && onPreviewBadge(cert)}
            className="relative w-16 h-16 rounded-xl bg-slate-950/80 p-1.5 border border-slate-750 flex items-center justify-center shrink-0 cursor-pointer group/badge shadow-md shadow-black/40 hover:border-cyan-400/50 transition-all"
            title="Click to view badge preview"
          >
            <img
              src={cert.badgeUrl}
              alt={`${cert.title} badge`}
              className="w-full h-full object-contain group-hover/badge:scale-110 transition-transform duration-200"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified</span>
          </div>
        </div>

        {/* Title & Issuer */}
        <h3 className="text-lg font-bold text-white tracking-tight leading-snug mb-1 group-hover:text-cyan-400 transition-colors">
          {cert.title}
        </h3>
        <p className="text-sm font-medium text-cyan-400 mb-3">{cert.issuer}</p>

        {/* Dates */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Issued: {cert.issueDate}</span>
          {cert.expiryDate && (
            <>
              <span className="text-slate-600">•</span>
              <span>Expires: {cert.expiryDate}</span>
            </>
          )}
        </div>

        {/* Credential ID with Copy Action */}
        <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <KeyRound className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-xs font-mono text-slate-300 truncate">
              {cert.credentialId}
            </span>
          </div>
          <button
            type="button"
            onClick={copyCredentialId}
            aria-label="Copy Credential ID"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="Copy Credential ID"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Skills Tag Cloud */}
        {cert.skills && cert.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {cert.skills.map((skill) => (
              <span
                key={skill}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Verification Link Button */}
      <div className="pt-4 border-t border-slate-800/80">
        <a
          href={cert.verificationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white border border-slate-700/60 transition-colors"
        >
          <span>Verify Credential</span>
          <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
        </a>
      </div>
    </div>
  );
}
