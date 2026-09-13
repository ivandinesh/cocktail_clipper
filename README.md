# CocktailClips - Local AI Video Clipper

## 📖 Project Overview

**CocktailClips** is a desktop application that automatically cuts and prepares short-form videos from a source video and transcript (SRT). Everything runs locally — no cloud services required.

### Core Philosophy
- **Single source of truth**: A master `project.json` file that every tool updates instead of creating separate metadata files
- **Local-first**: No cloud dependencies; everything runs on your machine
- **Cross-platform**: macOS/Linux first, then Windows compatible
- **No Docker**: Native execution only

### Tech Stack
| Layer | Technology |
|------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | FastAPI (Python 3.11+) |
| Video processing | FFmpeg (via Python wrappers) |
| Subtitle processing | pysubs2 |
| Styling | Tailwind dark UI |

### Project Structure
```
cocktailclips/
├── frontend/           # React Vite app
├── backend/            # FastAPI Python app
├── projects/           # Generated project directories
│   └── my-project/
│       ├── source.mp4
│       ├── source.srt
│       ├── project.json    # Single source of truth
│       ├── clips/          # Generated clip files
│       └── final/          # Final processed videos
├── assets/
│   ├── logo.png
│   ├── intro.png
│   └── outro.png
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- FFmpeg installed and available on PATH
- Git

### Installation

#### Backend Setup
```powershell
# 1. Navigate to backend
cd C:\pproj\cocktail_clipper\backend

# 2. Install Python dependencies
pip install fastapi uvicorn[standard] pysubs2 ffmpeg-python python-multipart

# 3. Verify FFmpeg is accessible
ffmpeg -version

# 4. Start the server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```powershell
# 1. Navigate to frontend
cd C:\pproj\cocktail_clipper\frontend

# 2. Install npm dependencies
npm install

# 3. Start development server
npm run dev -- --host

# 3. Open http://localhost:5173 in your browser
```

### Full Workflow
1. Open http://localhost:5173/create
2. Upload MP4 video file and SRT subtitle file
3. Enter project name (e.g., "Episode 12 - AI Podcast")
4. Click "Create Project"
5. Go to Dashboard to view your project
6. Select clip ranges and click "Cut" to extract segments
7. Clips appear in the table with status: planned → cut → completed
8. Configure branding (channel name, durations, logo)
9. Click "Stitch" to produce final branded video
10. Final video saved to `projects/{id}/final/`

---

## 📐 Project Phases

### Phase 1 — Foundation & Project Lifecycle (COMPLETE)
**Goal**: Enable users to create projects and import AI scenes

**Features Implemented:**
- ✅ Project creation with MP4 + SRT uploads
- ✅ Automatic project.json generation with UUID
- ✅ AI scene import from JSON files
- ✅ Project dashboard listing all projects
- ✅ Backend API: `POST /projects/create`, `POST /projects/import-scenes`, `GET /projects/{id}`
- ✅ Frontend: Project creation UI, dashboard, Tailwind dark mode

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET /` | Root | API information |
| `POST /projects/create` | Create project | Upload MP4+SRT, generate project.json |
| `POST /projects/import-scenes` | Import scenes | Merge AI-generated JSON into project |
| `GET /projects/{id}` | Get project | Retrieve project details from project.json |

---

### Phase 2 — Clip Cutter (COMPLETE)
**Goal**: Cut clips from source video using FFmpeg and extract transcripts

**Features Implemented:**
- ✅ FFmpeg `cut_clip()` wrapper with timestamp validation
- ✅ pysubs2 subtitle integration
- ✅ Subtitle timestamp shifting (start at 0 in clip)
- ✅ ASS subtitle file generation
- ✅ FFmpeg subtitle burning into video
- ✅ Clip status tracking (planned → cut → completed)
- ✅ Clips Table frontend component with actions
- ✅ Backend API: `POST /projects/{id}/cut`

**Key Python Modules:**
- `backend/app/cut_clip.py` - FFmpeg clip cutter
- `backend/app/pysubs2_integration.py` - Subtitle extraction/burning

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST /projects/{id}/cut` | Cut clip | FFmpeg segment extraction with pysubs2 subtitles |

---

### Phase 3 — Stitch / Branding Tool (COMPLETE)
**Goal**: Add intro/outro, logos, and subtitles to create final branded videos

**Features Implemented:**
- ✅ FFmpeg `stitch_video()` wrapper
- ✅ Intro video generation with channel name text
- ✅ Outro video generation with outro text
- ✅ Channel logo overlay
- ✅ Subtitle application from pysubs2 extraction
- ✅ Full project stitching: intro + clips + outro
- ✅ project.json updates with final_file and status="completed"
- ✅ Branding Settings frontend page
- ✅ Backend API: `POST /projects/{id}/stitch`

**Key Python Modules:**
- `backend/app/stitch_video.py` - Video stitching with progress
- `backend/app/main.py` - Full orchestrator

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST /projects/{id}/stitch` | Stitch project | Combine intro + clips + outro + logo |

---

### Phase 4 — Polish & Extensibility (IN PROGRESS)
**Goal**: Progress indicators, cross-platform testing, type hints, and publishing features

**Current Sprint Focus:**
- 🟡 **Sprint 16**: Progress indicators during FFmpeg operations
- ⏳ **Sprint 17**: Cross-platform testing & type hints
- 🟡 **Sprint 18**: Publishing features (YouTube, Instagram, TikTok, Twitter X, Facebook)
- ⏳ **Sprint 19**: Documentation & user guide

**Upcoming Features:**
- ⬜ Progress bars during clip cutting and video stitching
- ⬜ YouTube Data API v3 publishing with OAuth 2.0
- ⬜ Instagram Graph API publishing (Business/Creator account)
- ⬜ TikTok Content Post API (partnership required)
- ⬜ Twitter X API v2 media upload
- ⬜ Facebook Graph API publishing
- ⬜ Cross-platform compatibility (macOS, Linux, Windows)
- ⬜ Type hints throughout Python backend
- ⬜ Comprehensive user documentation
- ⬜ Troubleshooting guide

---

## 🔧 API Reference

### Base URL: `http://localhost:8000`

#### Project Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET /` | `/` | None | API status and available endpoints |
| `POST /projects/create` | `/projects/create` | None | Create new project with video+subtitle uploads |
| `POST /projects/import-scenes` | `/projects/import-scenes` | None | Import AI-generated scene JSON |
| `GET /projects/{project_id}` | `/projects/{project_id}` | None | Get project details and clips |

#### Clip Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST /projects/{id}/cut` | `/projects/{id}/cut` | None | Cut clip from source video (FFmpeg + pysubs2) |

#### Stitch Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST /projects/{id}/stitch` | `/projects/{id}/stitch` | None | Stitch final branded video (intro + clips + outro) |

**Request Examples:**

**Create Project:**
```http
POST /projects/create
Content-Type: multipart/form-data

video: [MP4 file]
subtitle: [SRT file]
project_name: "Episode 12 - AI Podcast"
```

**Cut Clip:**
```http
POST /projects/{project_id}/cut
Content-Type: application/x-www-form-urlencoded

start_time: "00:02:13.500"
end_time: "00:02:42.800"
clip_title: "Clip 001"
```

**Stitch Project:**
```http
POST /projects/{project_id}/stitch
Content-Type: application/x-www-form-urlencoded

logo_override: "/path/to/logo.png"  (optional)
```

---

## 📦 Python Dependencies

Create a virtual environment and install:

```powershell
cd C:\pproj\cocktail_clipper\backend
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
- Windows: Download from ffmpeg.zeranoe.com or use winget `winget FFmpeg`
- macOS: `brew install ffmpeg`
- Linux: `sudo apt install ffmpeg` or `sudo dnf install ffmpeg`

---

## 🌐 Publishing Features Roadmap

### YouTube Publishing
- **Status**: Planning (Sprint 18)
- **Requirements**: Google Cloud Console setup, OAuth 2.0
- **Features**:
  - Video upload with title, description, tags
  - Privacy status (public/private/unlisted)
  - YouTube Shorts support (< 60 seconds, vertical)
  - Thumbnail upload
  - OAuth 2.0 Desktop Application flow

### Instagram Publishing
- **Status**: Planning (Sprint 18)
- **Requirements**: Facebook Developer account, App review
- **Features**:
  - Feed posts (up to 60 seconds)
  - Stories (up to 15 seconds)
  - Reels (up to 90 seconds)
  - Graph API v20.0
  - Long-lived access token

### TikTok Publishing
- **Status**: Planning (Sprint 18)
- **Requirements**: Content Post API partnership
- **Features**:
  - Video with captions and hashtags
  - Cover image selection
  - Partnership approval required
  - Alternative: watermark-free download + manual upload

### Twitter X Publishing
- **Status**: Planning (Sprint 18)
- **Requirements**: Twitter Developer account, OAuth 2.0
- **Features**:
  - Media upload (GIF, PNG, JPEG, MP4)
  - Tweet with media attachment
  - Rate limit handling
  - OAuth 1.0a authentication

### Facebook Publishing
- **Status**: Planning (Sprint 18)
- **Requirements**: Same as Instagram (Meta-owned)
- **Features**:
  - Feed video posts
  - Stories
  - Reels
  - Graph API v20.0

**Important Notes:**
- All publishing is **optional** - core functionality works without it
- Each platform has community guidelines and content moderation
- Rate limits apply to all APIs
- Tokens require periodic refresh
- Users can always download and manually upload

---

## 📚 Project Documentation

### Available Docs
| Document | Description |
|----------|-------------|
| `project_planning.md` | Detailed 7-section project plan with scope, phases, risks, success metrics |
| `project_implementation_history.md` | Sprint-by-sprint tracking document |
| `README.md` | This file - overview, installation, API, roadmap |

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add some amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Bug Reports
- Use the issue tracker on GitHub
- Include: OS, Python version, FFmpeg version, steps to reproduce
- Check existing issues before submitting

---

## 📱 Supported Platforms

### Confirmed Working
- ✅ macOS (tested on Intel and Apple Silicon)
- ✅ Linux (Ubuntu/Debian tested)
- ⚠️ Windows (theoretically compatible, path separators need testing)

### Pending Testing
- 🔜 Full Windows compatibility verification
- 🔜 Cross-platform FFmpeg binary availability
- 🔜 Platform-specific path handling

### Not Applicable
- ❌ Docker (explicitly excluded per requirements)
- ❌ Cloud services (local-first architecture)

---

## 🆘 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `FFmpeg not found` | Install FFmpeg and ensure it's on PATH |
| `Module not found` | `pip install -r requirements.txt` |
| `CORS error` | Ensure frontend dev server proxy is configured |
| `Upload fails` | Check file types (MP4/SRT only for creation) |
| `Clip cutting fails` | Verify timestamps are in HH:MM:SS.mmm format |
| `Subtitles not burning` | Ensure pysubs2 is installed: `pip install pysubs2` |
| `Stitching fails` | Verify all clip files exist and have status "cut" |

### Getting Help
- Check `project_implementation_history.md` for development context
- Review `project_planning.md` for original requirements
- Open an issue on GitHub with detailed information
- Contact: Review the codebase for implementation details

---

## 📅 Version & Release

| Version | Release Date | Status |
|---------|--------------|--------|
| 0.1.0 | Current | Alpha - Phases 1-3 complete |
| 0.2.0 | Planned | Beta - Phase 4 progress indicators |
| 1.0.0 | Planned | Stable - All phases complete + publishing |

---

## 🙏 Acknowledgments

- **Google DevOps Patterns** - Skill framework used for agent organization
- **FFmpeg Team** - Video processing foundation
- **pysubs2 Contributors** - Subtitle processing library
- **FastAPI Team** - Modern Python web framework
- **React Team** - UI library

---

*CocktailClips - Making video clipping simple, local, and private.*