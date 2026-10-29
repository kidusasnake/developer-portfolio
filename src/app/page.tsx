import React from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProjectsShowcase from "@/components/ProjectsShowcase";
import CertificationsShowcase from "@/components/CertificationsShowcase";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { getPortfolioDataAsync } from "@/lib/portfolio-data";

export default async function Home() {
  const data = await getPortfolioDataAsync();

  return (
    <div className="relative min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Sticky Glass Navbar */}
      <Navbar profile={data.profile} />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero profile={data.profile} />

        {/* Projects Showcase with Tech Tag Filtering & Search */}
        <ProjectsShowcase initialProjects={data.projects} />

        {/* Certifications & Badges Showcase */}
        <CertificationsShowcase certifications={data.certifications} />

        {/* Interactive Contact Section */}
        <ContactSection profile={data.profile} />
      </main>

      {/* Footer */}
      <Footer profile={data.profile} />
    </div>
  );
}
