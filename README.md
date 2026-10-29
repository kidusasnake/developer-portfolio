# Modular Developer Portfolio & Headless CMS

> Modern, high-performance developer portfolio built with Next.js App Router, TypeScript, and Tailwind CSS, backed by a decoupled JSON CMS dashboard with live sync.

---

## ⚡ Highlights

- **Dynamic Public Landing Page**:
  - **Hero Section**: Value proposition, dynamic career statistics, and interactive resume download.
  - **Projects Showcase**: Interactive tech tag filtering (Next.js, TypeScript, React, AI, Rust, etc.) and instant keyword search.
  - **Verified Certifications & Badges**: Vector SVG credentials (AWS, GCP, CKA, Terraform, Meta) with one-click credential ID copy and official verification portals.
  - **Contact Section**: Interactive messaging interface with instant delivery feedback, timezone details, and email copy.
- **Decoupled Admin CMS Portal (`/admin`)**:
  - Secure session password authentication.
  - CRUD operations for projects and credentials.
  - Integrated file uploader for badge icons and project screenshots.
  - Profile & Hero settings customizer (bio, headline, links, and metrics).
  - Public page reflects updates instantly without rebuilding.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **UI & Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Icons**: [Lucide Icons](https://lucide.dev/) & Custom Vector SVGs
- **Data & Storage**: Headless JSON Data Layer with Atomic File System Sync & Server Revalidation

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

- Open [http://localhost:3000](http://localhost:3000) to view the public portfolio.
- Navigate to [http://localhost:3000/admin](http://localhost:3000/admin) to access the CMS (Default password: `admin123`).

---

## ⚙️ Environment Configuration

| Variable | Description | Default |
| :--- | :--- | :--- |
| `ADMIN_PASSWORD` | Password for accessing the `/admin` CMS portal | `admin123` |

---

## 📦 Production Build

```bash
npm run build
npm start
```
