# CocktailClips Frontend

React 19 + Vite 8 + Tailwind CSS 4 frontend for the CocktailClips local AI video clipper application.

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- Backend server running on `http://localhost:8000`
- FFmpeg installed and available on PATH

### Installation

```powershell
cd frontend
npm install
```

### Development

```powershell
npm run dev
```

Opens the app at `http://localhost:5173`.

### Build

```powershell
npm run build
```

### Preview Production Build

```powershell
npm run preview
```

### Lint

```powershell
npm run lint
```

## Architecture

- **App.tsx** — Main application component with React Router navigation (Create, Dashboard, Branding, Import, Cut, Stitch pages)
- **CreateProject.tsx** — Project creation form with MP4 + SRT file upload
- **Dashboard.tsx** — Project dashboard showing clips and overview, uses `useSearchParams` for projectId
- **ClipsTable.tsx** — Table view of clips with actions (recut, restitch, edit, download, preview)
- **BrandingSettings.tsx** — Edit channel name, intro/outro durations, outro text
- **ImportScenes.tsx** — Upload AI-generated JSON scene files
- **ClipCutter.tsx** — Cut clips from source video with start/end timestamps
- **StitchPanel.tsx** — Stitch all clips with branding and download final videos
- **main.tsx** — Entry point rendering the React app with BrowserRouter
- **index.css** — Tailwind CSS directives + custom scrollbar + spin animation
- **vite.config.ts** — Vite config with API proxy to backend on port 8000
- **postcss.config.ts** — PostCSS config using `@tailwindcss/postcss` (Tailwind CSS v4)
- **tailwind.config.ts** — Tailwind CSS configuration
- **tsconfig.app.json** — TypeScript config with `react-router-dom` types

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Create | `/` | Upload MP4 + SRT, create project |
| Dashboard | `/dashboard` | View all projects and clips |
| Branding | `/branding` | Edit channel, durations, outro text |
| Import | `/import` | Upload AI-generated JSON scenes |
| Cut | `/cut` | Cut clips from source video |
| Stitch | `/stitch` | Stitch clips with branding + download |

## API Proxy

The dev server proxies `/api` requests to `http://localhost:8000` (the FastAPI backend).

## Key Features

- **Download buttons** on clips table for preview and final videos
- **Recut/Restitch** buttons for individual clips
- **Progress indicators** during FFmpeg processing
- **Minimalist dark UI** with Tailwind CSS v4
- **React Router v7** navigation with `useSearchParams`
- **Tailwind CSS v4** with `@tailwindcss/postcss`

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx          # Main app component with routing
│   ├── CreateProject.tsx # Project creation with file upload
│   ├── Dashboard.tsx    # Project dashboard
│   ├── ClipsTable.tsx   # Clips table with actions
│   ├── BrandingSettings.tsx # Branding configuration
│   ├── ImportScenes.tsx # AI scene import
│   ├── ClipCutter.tsx   # Clip cutting
│   ├── StitchPanel.tsx  # Stitching and download
│   ├── main.tsx         # Entry point
│   ├── index.css        # Tailwind directives
│   └── App.css          # Custom styles
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── index.html           # HTML entry point
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.ts
├── tsconfig.json
├── tsconfig.app.json
└── tsconfig.node.json
```

## Build Notes

- Uses `@tailwindcss/postcss` for Tailwind CSS v4 (not the old `tailwindcss` PostCSS plugin)
- `tsconfig.app.json` includes `"react-router-dom"` in types array
- `npm run build` runs `tsc -b && vite build`
- `npm run lint` uses `oxlint`
