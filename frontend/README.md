# CocktailClips Frontend

React + Vite + Tailwind CSS frontend for the CocktailClips local AI video clipper application.

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- Backend server running on `http://localhost:8000`

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

- **App.tsx** — Main application component with project creation and navigation
- **Dashboard.tsx** — Project dashboard showing clips and overview
- **ClipsTable.tsx** — Table view of clips with actions (recut, restitch, edit)
- **main.tsx** — Entry point rendering the React app
- **index.css** — Tailwind CSS directives
- **vite.config.ts** — Vite config with API proxy to backend on port 8000
- **tailwind.config.ts** — Tailwind CSS configuration
- **postcss.config.ts** — PostCSS config using `@tailwindcss/postcss`

## API Proxy

The dev server proxies `/api` requests to `http://localhost:8000` (the FastAPI backend).

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx          # Main app component
│   ├── Dashboard.tsx    # Project dashboard
│   ├── ClipsTable.tsx   # Clips table with actions
│   ├── main.tsx         # Entry point
│   ├── index.css        # Tailwind directives
│   └── App.css          # Custom styles
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.ts
└── tsconfig.json
```
