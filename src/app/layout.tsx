import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alex Rivera | Senior Full-Stack & Cloud Architect Portfolio",
  description:
    "Modular developer portfolio featuring high-performance systems, verified cloud certifications, production projects, and an interactive CMS admin interface.",
  keywords: [
    "Full Stack Developer",
    "Cloud Architect",
    "Next.js",
    "TypeScript",
    "Tailwind CSS",
    "Kubernetes",
    "AWS",
    "Portfolio"
  ],
  authors: [{ name: "Alex Rivera" }],
  openGraph: {
    title: "Alex Rivera | Senior Full-Stack & Cloud Architect",
    description: "Explore production projects, verified cloud certifications, and live architecture demos.",
    type: "website"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-[#090d16] text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
