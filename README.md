# CocktailClips — Local AI Video Clipper

An Apple-inspired media workspace for cutting and preparing short-form videos from source video and transcript (SRT). Everything runs locally — no cloud services required.

## 📖 Project Overview

**CocktailClips** is a desktop media application that transforms long videos into short-form clips using AI scene analysis. It features a polished macOS-inspired interface inspired by Final Cut Pro and iMovie, with a master `project.json` as the single source of truth.

### Core Philosophy
- **Single source of truth**: A master `project.json` file that every tool updates
- **Local-first**: No cloud dependencies; everything runs on your machine
- **Cross-platform**: macOS/Linux first, then Windows compatible
- **No Docker**: Native execution only
- **Visual editing**: Interact visually with scenes, clips, and sequences; advanced users can edit JSON directly

### Tech Stack
| Layer | Technology |
|------|-----------|
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 |
| Backend | FastAPI (Python 3.11+) |
| Video processing | FFmpeg (via Python wrappers) |
| Subtitle processing | pysubs2 |
| Styling | Apple-inspired light theme (Tailwind) |
| State management | Zustand |
| Icons | Lucide React (thin-line) |
| Routing | React Router DOM v7 |
| TypeScript | 6 with strict project references |

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- FFmpeg installed and available on PATH
- Git

### Installation

#### Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
ffmpeg -version
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```

### Full Workflow
1. **Create Project** — Drop your video (MP4) and optional SRT/transcript
2. **Analyze** — AI detects scenes from transcript
3. **Review Scenes** — Visual cards with thumbnails, importance scores, tags
4. **Select & Cut** — Choose scenes, create clips with FFmpeg
5. **Review Clips** — Media-browser style clip library with preview
6. **Stitch** — Drag-and-drop timeline to arrange clips
7. **Add Hook/Captions** — Opening hook, caption style, end hook
8. **Export** — Render final video with progress tracking

## 🎨 Design System

The frontend follows Apple's human interface guidelines:

- **Light theme**: `#f5f5f7` background, white panels, `#1d1d1f` text
- **Accent**: Apple blue `#0071e3`
- **Font stack**: `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Helvetica Neue', Arial`
- **Border radius**: 8-10px controls, 14px cards, 16-24px dialogs
- **Glass morphism**: Selective use on toolbar, sidebar, inspector (`backdrop-filter: blur(20px)`)
- **Motion**: 150-250ms transitions, `prefers-reduced-motion` support
- **Typography**: Weight and size establish hierarchy, not excessive boxes

### Layout
```
┌──────────────────────────────────────────────────────────┐
│ Project Name              Status        Export             │  ← TopToolbar
├────────────┬─────────────────────────────┬─────────────────┤
│            │                             │                 │
│ PROJECT    │     VIDEO PREVIEW           │   INSPECTOR     │
│            │                             │   (contextual)  │
│ Sources    │                             │                 │
│ Scenes     │                             │                 │
│ Clips      │                             │                 │
│ Stitch     │                             │                 │
│ Exports    │                             │                 │
│            │                             │                 │
├────────────┴─────────────────────────────┴─────────────────┤
│                    CLIP / SCENE TIMELINE                   │  ← Timeline
└──────────────────────────────────────────────────────────┘
```

### Keyboard Shortcuts
- **Space** — Play/Pause
- **← / →** — Seek
- **I / O** — Mark In/Out
- **Cmd/Ctrl + S** — Save Project
- **Cmd/Ctrl + E** — Export
- **Delete** — Remove selected item
- **Esc** — Close dialog / Deselect
- **?** — Keyboard shortcuts help

## 📐 Project Structure
```
cocktailclips/
├── frontend/           # React Vite app (Apple-inspired media workspace)
│   ├── src/
│   │   ├── App.tsx              # Main app with Apple layout (TopToolbar + Sidebar + Inspector)
│   │   ├── pages/               # Route-based page components
│   │   │   ├── CreateProject.tsx  # Drag-and-drop project creation
│   │   │   ├── ProjectHome.tsx    # Dashboard with workflow progression
│   │   │   ├── Scenes.tsx         # Scene grid/list with AI analysis
│   │   │   ├── Clips.tsx          # Clip review and cutting
│   │   │   ├── Stitch.tsx         # Timeline-based stitch workspace
│   │   │   ├── Export.tsx         # Export settings and progress
│   │   │   └── MasterJSON.tsx     # Visual/JSON mode editor
│   │   ├── components/
│   │   │   ├── layout/          # AppShell, TopToolbar, Sidebar, Inspector
│   │   │   ├── media/           # SceneCard, ClipCard, VideoPreview, Timeline
│   │   │   ├── ui/              # Button, Badge, Card, Input, Select, Spinner, ProgressBar, DropZone, EmptyState, Toast
│   │   │   ├── workflow/        # ProcessingStatus, JSONEditor
│   │   │   └── components.ts    # Barrel exports
│   │   ├── stores/
│   │   │   └── projectStore.ts  # Zustand state management
│   │   ├── hooks/
│   │   │   ├── useKeyboardShortcuts.ts
│   │   │   ├── useAsync.ts
│   │   │   └── useLocalStorage.ts
│   │   ├── types/
│   │   │   └── index.ts         # Project, Clip, Scene, ProcessingState, ToastMessage
│   │   ├── index.css            # Apple-inspired design system
│   │   └── main.tsx             # Entry point
│   ├── index.html
│   ├── vite.config.ts           # Vite config with API proxy to backend
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   └── package.json
├── backend/            # FastAPI Python app
│   ├── app/
│   │   ├── main.py           # FastAPI app with all endpoints
│   │   ├── cut_clip.py       # FFmpeg clip cutter wrapper
│   │   ├── stitch_video.py   # FFmpeg stitching wrapper
│   │   ├── pysubs2_integration.py # Subtitle extraction & burning
│   │   └── publish_video.py  # Publishing features (extensible)
│   ├── requirements.txt
│   └── venv/
├── projects/           # Generated project directories
│   └── my-project/
│       ├── source.mp4
│       ├── source.srt
│       ├── project.json      # Single source of truth
│       ├── clips/            # Generated clip files
│       └── final/            # Final processed videos
├── assets/
│   ├── logo.png
│   ├── intro.png
│   └── outro.png
└── README.md
```

## 🎨 Frontend Pages

### Create Project
Drag-and-drop video file (MP4), optional SRT/transcript, or import project JSON. Clean hero screen with project name input.

### Project Home
Immediately answers: What video am I working on? What stage is the project in? What should I do next? Shows source video preview, project info, and a clean workflow progression (Source → Analyze → Select → Cut → Stitch → Export) with completion indicators.

### Scenes
AI-detected scenes displayed as visual cards in Grid or List view. Each card shows thumbnail, timestamp range, title, AI summary, importance score, and tags. Click to preview, select for clipping.

### Clips
Media-browser style clip library. Each clip shows thumbnail, name, duration, source timestamp, and status. Hover reveals actions: Play, Rename, Include/Exclude, Delete, Edit Start/End, Add to Stitch.

### Stitch
Horizontal timeline for arranging clips. Drag-and-drop reordering. Shows total output duration. Inspector panel for selected clip properties.

### Export
Clean export settings sheet with resolution, aspect ratio, captions, hook options. Progress tracking during rendering. Export complete with file details and actions.

### Master JSON
Two-mode editor: Visual (understandable UI controls) and JSON (polished code editor with syntax highlighting, validate, format, copy, save).

## 🔧 API Reference

### Base URL: `http://localhost:8000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET /` | Root | API status and available endpoints |
| `POST /projects/create` | Create project | Upload MP4+SRT, generate project.json |
| `POST /projects/import-scenes` | Import scenes | Merge AI-generated JSON into project |
| `GET /projects/{id}` | Get project | Retrieve project details from project.json |
| `POST /projects/{id}/cut` | Cut clip | FFmpeg segment extraction with pysubs2 subtitles |
| `POST /projects/{id}/stitch` | Stitch project | Combine intro + clips + outro + logo |
| `POST /projects/{id}/clip/{clipId}/recut` | Recut clip | Cut a clip with new timestamps |
| `POST /projects/{id}/clip/{clipId}/restitch` | Restitch clip | Restitch a single clip with branding |
| `GET /projects/{id}/clips/{clipId}/preview` | Preview clip | Stream preview video file |
| `GET /projects/{id}/download` | Download final | Download final stitched video |

## 📦 Dependencies

### Python
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

**requirements.txt:**
```
fastapi>=0.100.0
uvicorn[standard]>=0.27.0
pysubs2>=1.0.0
ffmpeg-python>=0.2.0
python-multipart>=0.0.6
```

### Frontend
```powershell
cd frontend
npm install
```

**Key dependencies:**
- React 19 + ReactDOM 19
- React Router DOM 7
- Vite 8 + @vitejs/plugin-react 6
- Tailwind CSS 4 + @tailwindcss/postcss 4
- TypeScript 6
- Zustand (state management)
- Lucide React (icons)

## 🎯 Features

### Phase 1 — Foundation ✅
- Project creation with drag-and-drop MP4 + SRT uploads
- Automatic project.json generation
- AI scene import from JSON files
- Apple-inspired media workspace layout

### Phase 2 — Clip Cutter ✅
- FFmpeg `cut_clip()` wrapper with timestamp validation
- pysubs2 subtitle integration with timestamp shifting
- ASS subtitle file generation and burning into video
- Clip status tracking (planned → cut → completed)
- Media-browser style clip review

### Phase 3 — Stitch / Branding ✅
- FFmpeg `stitch_video()` wrapper with progress tracking
- Intro video generation with channel name text
- Outro video generation with next_hook text
- Channel logo overlay
- Subtitle application from pysubs2 extraction
- Full project stitching: intro + clips + outro
- Download final stitched videos from UI

### Phase 4 — Polish ✅
- Apple-inspired light theme design system
- macOS-style top toolbar with status indicators
- Glass morphism on toolbar, sidebar, inspector
- Contextual Inspector panel
- Processing feedback with individual item progress
- Toast notifications
- Keyboard shortcuts (Space, ←→, I/O, Cmd+S, Cmd+E, ?)
- Drag-and-drop interactions
- Grid/List view toggle for scenes
- Visual/JSON mode toggle for master JSON
- Empty states with actionable guidance
- `prefers-reduced-motion` support

## 🔧 FFmpeg Wrappers

### cut_clip()
Cuts a video clip from source video between start/end timestamps using FFmpeg.

### create_intro()
Generates an intro card with channel name and hook text.

### burn_subtitles()
Burns ASS subtitles into video using FFmpeg.

### create_outro()
Generates an outro card with next_hook text.

### stitch_video()
Concatenates intro + clips + outro into a final branded video with optional logo overlay.

## 📝 Subtitle Handling

Uses pysubs2 for subtitle processing:
1. Load SRT file
2. Extract subtitle events within clip timestamps
3. Shift timestamps so subtitles start at 0 in the clip
4. Generate temporary ASS subtitle file
5. Burn ASS into video with FFmpeg
6. If transcript exists in project.json, regenerate subtitles from transcript timestamps

## 🌐 Publishing Features Roadmap

### YouTube Publishing
- Video upload with title, description, tags
- YouTube Shorts support
- OAuth 2.0 Desktop Application flow

### Instagram Publishing
- Feed posts, Stories, Reels
- Graph API v20.0

### TikTok Publishing
- Video with captions and hashtags
- Alternative: watermark-free download + manual upload

### Twitter X Publishing
- Media upload with tweet attachment
- OAuth 1.0a authentication

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| `FFmpeg not found` | Install FFmpeg and ensure it's on PATH |
| `Module not found` | `pip install -r requirements.txt` |
| `CORS error` | Ensure frontend dev server proxy is configured |
| `Upload fails` | Check file types (MP4/SRT only) |
| `Clip cutting fails` | Verify timestamps are in HH:MM:SS.mmm format |
| `Subtitles not burning` | Ensure pysubs2 is installed |
| `Stitching fails` | Verify all clip files have status "cut" |
| `Build fails` | Run `npm run build` and check TypeScript errors |

## 📱 Supported Platforms

- ✅ macOS (Intel and Apple Silicon)
- ✅ Linux (Ubuntu/Debian)
- ✅ Windows (tested)
- ❌ Docker (explicitly excluded)
- ❌ Cloud services (local-first architecture)

## 📅 Version

| Version | Status |
|---------|--------|
| 0.1.0 | Current — All phases complete |

---

*CocktailClips — Making video clipping simple, local, and private. Designed like a premium native macOS media tool.*
