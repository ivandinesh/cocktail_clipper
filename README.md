# CocktailClips — Local AI Video Clipper

Build a complete local application that automatically cuts and prepares short-form videos from a source video and transcript (SRT). Everything runs locally — no cloud services required.

## 📖 Project Overview

**CocktailClips** is a desktop application that cuts and prepares short-form videos from a source video and transcript (SRT). It uses a master `project.json` as the single source of truth.

### Core Philosophy
- **Single source of truth**: A master `project.json` file that every tool updates
- **Local-first**: No cloud dependencies; everything runs on your machine
- **Cross-platform**: macOS/Linux first, then Windows compatible
- **No Docker**: Native execution only

### Tech Stack
| Layer | Technology |
|------|-----------|
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 |
| Backend | FastAPI (Python 3.11+) |
| Video processing | FFmpeg (via Python wrappers) |
| Subtitle processing | pysubs2 |
| Styling | Tailwind dark UI (minimalist modern) |
| Routing | React Router DOM v7 |

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
1. **Create Project** — Upload MP4 + SRT, enter project name
2. **Import AI Scenes** (optional) — Upload AI-generated JSON with clip timestamps
3. **Cut Clips** — Specify start/end times, extract video segments with subtitles
4. **Review Clips** — View all clips in the table with status, preview, download
5. **Branding Settings** — Configure channel name, intro/outro durations, outro text
6. **Stitch & Brand** — Combine all clips with intro/outro branding into final videos
7. **Download** — Download final branded videos directly from the UI

## 📐 Project Structure
```
cocktailclips/
├── frontend/           # React Vite app (React 19 + Vite 8 + Tailwind 4)
│   ├── src/
│   │   ├── App.tsx          # Main app with React Router navigation
│   │   ├── CreateProject.tsx # Project creation with file upload
│   │   ├── Dashboard.tsx    # Project dashboard with clip list
│   │   ├── ClipsTable.tsx   # Clips table with actions (recut, restitch, download)
│   │   ├── BrandingSettings.tsx # Edit channel, durations, outro text
│   │   ├── ImportScenes.tsx # Upload AI-generated JSON scenes
│   │   ├── ClipCutter.tsx   # Cut clips from source video
│   │   ├── StitchPanel.tsx  # Stitch clips with branding + download
│   │   ├── main.tsx         # Entry point with BrowserRouter
│   │   └── index.css        # Tailwind directives + custom styles
│   ├── index.html           # HTML entry point (title: CocktailClips)
│   ├── vite.config.ts       # Vite config with API proxy to backend
│   ├── postcss.config.ts    # PostCSS using @tailwindcss/postcss
│   ├── tailwind.config.ts   # Tailwind CSS configuration
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

### Dashboard
Show all projects with clip count and progress. Click a project to view clips.

### Project View
Display source video, subtitle upload status, number of clips, and progress bar.

### Clips Table
Columns: Clip ID, Start, End, Title, Status, Clip File, Final File, Actions.
Each row has: Preview (↓), Recut, Restitch, Edit Hook, Edit Title, Download.

### Branding Settings
Editable: Channel name, Intro duration, Outro duration, Outro text.
Saved into project.json via PATCH API.

### Import Scenes
Upload AI-generated JSON containing scenes with start/end/title/hook/next_hook.

### Clip Cutter
Enter start/end times and optional title to cut a clip from the source video.

### Stitch Panel
Stitch all cut clips with intro/outro branding. Download final videos.

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

## 📦 Python Dependencies

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### requirements.txt
```
fastapi>=0.100.0
uvicorn[standard]>=0.27.0
pysubs2>=5.0.0
ffmpeg-python>=0.2.0
python-multipart>=0.0.6
```

**System Requirements:**
- FFmpeg must be installed and available on PATH
- Windows: `winget install FFmpeg` or download from ffmpeg.org
- macOS: `brew install ffmpeg`
- Linux: `sudo apt install ffmpeg`

## 📦 Frontend Dependencies

```powershell
cd frontend
npm install
```

### Key Dependencies
- React 19 + ReactDOM 19
- React Router DOM 7
- Vite 8 + @vitejs/plugin-react 6
- Tailwind CSS 4 + @tailwindcss/postcss 4
- TypeScript 6

## 🎯 Features

### Phase 1 — Foundation ✅
- Project creation with MP4 + SRT uploads
- Automatic project.json generation
- AI scene import from JSON files
- Project dashboard listing all projects

### Phase 2 — Clip Cutter ✅
- FFmpeg `cut_clip()` wrapper with timestamp validation
- pysubs2 subtitle integration with timestamp shifting
- ASS subtitle file generation and burning into video
- Clip status tracking (planned → cut → completed)
- Clips Table with recut, restitch, edit, and download actions

### Phase 3 — Stitch / Branding ✅
- FFmpeg `stitch_video()` wrapper with progress tracking
- Intro video generation with channel name text
- Outro video generation with next_hook text
- Channel logo overlay
- Subtitle application from pysubs2 extraction
- Full project stitching: intro + clips + outro
- Download final stitched videos from UI

### Phase 4 — Polish ✅
- Progress indicators during FFmpeg operations
- Download buttons for clips and final videos
- Recut and Restitch functionality per clip
- Branding settings page
- Import scenes page
- Minimalist modern dark UI

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

*CocktailClips — Making video clipping simple, local, and private.*
