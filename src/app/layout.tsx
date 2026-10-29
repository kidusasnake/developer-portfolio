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
  metadataBase: new URL("https://kidusasnake.pro.et"),
  title: "Kidus Asnake | Full-Stack Software Engineer & Cloud Architect",
  description:
    "Modular developer portfolio featuring high-performance cloud systems, verified certifications, production projects, and an interactive CMS admin interface.",
  keywords: [
    "Kidus Asnake",
    "Full Stack Developer",
    "Cloud Architect",
    "Next.js",
    "TypeScript",
    "Tailwind CSS",
    "Kubernetes",
    "AWS",
    "Portfolio",
    "Ethiopia Developer"
  ],
  authors: [{ name: "Kidus Asnake", url: "https://kidusasnake.pro.et" }],
  openGraph: {
    title: "Kidus Asnake | Full-Stack Software Engineer & Cloud Architect",
    description: "Explore production projects, verified cloud certifications, and live architecture demos.",
    url: "https://kidusasnake.pro.et",
    siteName: "Kidus Asnake Portfolio",
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
