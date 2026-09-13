# Project Planning — CocktailClips

## 1. Project Overview

**CocktailClips** — Local AI Video Clipper (React + FastAPI + FFmpeg)
A desktop application that automatically cuts and prepares short-form videos from a source video and transcript (SRT). Everything runs locally — no cloud services.

### Core Concept
- **Single source of truth**: A master `project.json` file that every tool updates instead of creating separate metadata files.
- **Local-first**: No cloud dependencies; runs on macOS/Linux first, then Windows.
- **Workflow**: Create project → Upload video + SRT → Import AI scenes → Cut clips → Review → Stitch branded Shorts → Export.

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
├── frontend/       # React Vite app
├── backend/        # FastAPI Python app
├── projects/
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

### Master project.json Schema
```json
{
  "project": { "id": "podcast-001", "name": "Episode 12 - AI Podcast" },
  "source": { "video": "source.mp4", "subtitle": "source.srt" },
  "branding": {
    "channel": "CocktailClips",
    "intro_duration": 2,
    "outro_duration": 2,
    "outro_text": "Follow for Part 2"
  },
  "clips": [
    {
      "id": "001",
      "start": "00:02:13.500",
      "end": "00:02:42.800",
      "title": "He accidentally revealed the secret.",
      "hook": "You won't believe what he admitted...",
      "next_hook": "Part 2 explains why this happened.",
      "transcript": "Transcript for only this clip.",
      "clip_file": null,
      "final_file": null,
      "status": "planned"
    }
  ]
}
```

---

## 2. Scope Analysis

### In-Scope Features
| Feature | Description |
|---------|-------------|
| **Feature 1 — Project Creator** | UI to create project, upload MP4/SRT, create initial project.json |
| **Feature 2 — AI Scene Import** | Upload AI-generated JSON containing scenes, merge into project.json (no video processing) |
| **Feature 3 — Clip Cutter** | Read project.json, cut source video with FFmpeg, save clips/001.mp4, extract transcript lines from SRT between start/end, store transcript in project.json, update status = "cut" |
| **Feature 4 — Stitch / Branding Tool** | Read project.json, add 2-second intro card (uses hook text), background = intro.png or solid black, add channel logo, burn subtitles only if clip doesn't already contain subtitles, use transcript from project.json, subtitle style: white text, black outline, bottom centered, TikTok/Shorts style, add outro card (displays next_hook text), save final/001.mp4, update status = "completed" |
| **Dashboard Page** | Show all projects |
| **Project View Page** | Display source video, subtitle uploaded, number of clips, progress bar |
| **Clips Table** | Columns: Clip ID, Start, End, Title, Status, Preview, Transcript, Clip file, Final file. Row actions: Preview clip, Recut button, Restitch button, Edit hook, Edit title, Edit transcript |
| **Branding Settings** | Editable: Channel name, Intro duration, Outro duration, Outro text, Upload intro background, Upload outro background, Upload logo. Saved into project.json |
| **Backend APIs** | REST endpoints for all operations: create, import-scenes, get, cut, stitch, recut, restitch |
| **FFmpeg Python Wrappers** | Reusable functions: cut_clip(), create_intro(), burn_subtitles(), create_outro(), stitch_video() — each function independent |
| **Subtitle Handling** | Load SRT, extract only subtitle events inside clip timestamps, shift timestamps so subtitles start at 0, generate temporary ASS file, burn ASS into video with FFmpeg, if transcript already exists in project.json, regenerate subtitles from transcript timestamps |
| **Setup & Documentation** | backend/README.md, frontend/README.md, root README.md with complete workflow |

### Out-of-Scope (Future Considerations)
- Docker deployment (explicitly excluded: "Do not use Docker")
- Cloud publishing (YouTube/TikTok — noted as "easy to extend later")
- AI scene detection (noted as "easy to extend later")
- Multi-user collaboration
- Real-time video processing preview
- Advanced subtitle animation beyond basic style
- Video effects/filters beyond intro/outro/subtitles

### Key Constraints
| Constraint | Detail |
|------------|--------|
| Platform | Cross-platform: macOS/Linux first, Windows compatible |
| Architecture | No Docker — must run natively |
| UI | Tailwind dark UI required |
| Progress | Progress indicators during FFmpeg processing |
| Typing | Typed Python where practical |
| Folder structure | Clean, organized project structure |
| Extension | Must be easy to extend later with YouTube/TikTok publishing and AI scene detection |

---

## 3. Phase Plan

### Phase 1 — Foundation & Project Lifecycle (Weeks 1-4)
**Goal**: Enable users to create projects and import AI scenes.

| Milestone | Deliverables |
|-----------|-------------|
| 1.1 | Backend: `POST /projects/create` endpoint; validate MP4/SRT uploads; generate initial `project.json` |
| 1.2 | Backend: `POST /projects/import-scenes` endpoint; merge AI-generated JSON into project.json |
| 1.3 | Frontend: Project creation UI — file uploaders for MP4 and SRT; project name input; success state |
| 1.4 | Frontend: Project dashboard — list all created projects with basic info |
| 1.5 | Documentation: backend/README.md, frontend/README.md, root README.md with workflow overview |

**Success Criteria**: User can create a new project, upload video + SRT, and import AI scene JSON. project.json is properly initialized.

---

### Phase 2 — Clip Cutter (Weeks 5-8)
**Goal**: Cut clips from source video using FFmpeg and extract transcripts.

| Milestone | Deliverables |
|-----------|-------------|
| 2.1 | Backend: `POST /projects/{id}/cut` endpoint; accept clip definitions (start/end timestamps); invoke FFmpeg `cut_clip()` wrapper |
| 2.2 | Backend: `cut_clip()` Python wrapper — FFmpeg command to extract segment from source.mp4; save to clips/001.mp4 |
| 2.3 | Backend: pysubs2 integration — extract subtitle events within clip timestamps; shift timestamps to start at 0; generate temporary ASS file |
| 2.4 | Backend: `burn_subtitles()` wrapper — burn ASS subtitles into clipped video with FFmpeg; fallback: if transcript exists in project.json, regenerate from transcript timestamps |
| 2.5 | Frontend: Clips Table page — display clips with columns: ID, Start, End, Title, Status, Preview, Transcript, Clip file, Final file; Preview clip thumbnails |
| 2.6 | Frontend: Row actions — Preview clip, Recut button, Restitch button, Edit hook, Edit title, Edit transcript |
| 2.7 | project.json updates: `clip_file` populated, `status` = "cut" for each clipped item |

**Success Criteria**: User can select a clip range, click "Cut", and the clip is saved. Clip appears in the table with transcript. Status updates to "cut".

---

### Phase 3 — Stitch / Branding Tool (Weeks 9-12)
**Goal**: Add intro/outro, logos, and subtitles to create final branded videos.

| Milestone | Deliverables |
|-----------|-------------|
| 3.1 | Backend: `POST /projects/{id}/stitch` endpoint; process all clips for a project |
| 3.2 | Backend: `create_intro()` Python wrapper — add 2-second intro card using hook text; background = intro.png or solid black |
| 3.3 | Backend: `create_outro()` Python wrapper — add outro card displaying next_hook text |
| 3.4 | Backend: Add channel logo overlay if available (intro.png/logo.png) |
| 3.5 | Backend: `burn_subtitles()` — only if clip does not already contain subtitles; use transcript from project.json; subtitle style: white text, black outline, bottom centered, TikTok/Shorts style |
| 3.6 | Frontend: Branding Settings page — editable: Channel name, Intro duration, Outro duration, Outro text, Upload intro background, Upload outro background, Upload logo; saved into project.json |
| 3.7 | Frontend: Progress indicators during FFmpeg processing (per-clips and overall) |
| 3.8 | project.json updates: `final_file` populated, `status` = "completed" for each finished clip |

**Success Criteria**: User can click "Stitch" and receive final branded videos in final/ directory. All branding elements (intro, outro, logo, subtitles) are correctly applied.

---

### Phase 4 — Polish & Extensibility (Weeks 13-16)
**Goal**: Polish UI, add progress indicators, ensure cross-platform compatibility, document for extension.

| Milestone | Deliverables |
|-----------|-------------|
| 4.1 | Frontend: Progress bars during FFmpeg processing (both clip cutting and stitching) |
| 4.2 | Cross-platform testing: macOS/Linux compatibility; Windows path handling; FFmpeg availability checks |
| 4.3 | Type hints for Python backend where practical |
| 4.4 | Error handling: FFmpeg failures, missing files, invalid timestamps, subtitle extraction errors |
| 4.5 | Extension points added: YouTube/TikTok publishing scaffold; AI scene detection hook locations |
| 4.6 | Final documentation review; user guide for complete workflow |

**Success Criteria**: Application is stable, cross-platform, well-documented, and ready for future YouTube/TikTok publishing and AI scene detection features.

---

## 4. Technical Requirements

### Backend (FastAPI)
- Python 3.11+
- FastAPI with async route handlers
- Python wrappers for FFmpeg (subprocess calls)
- pysubs2 for subtitle processing
- JSON file I/O for project.json management
- File system operations (video clips, assets, project folders)

### Frontend (React + Vite + Tailwind)
- React 18+ with functional components and hooks
- Vite build tool with Tailwind CSS dark mode
- React Router for page navigation
- State management: React Query or SWR for API data
- File upload components (MP4, SRT, JSON, images)
- Table component with action buttons
- Progress indicator component
- Form components for branding settings

### FFmpeg Python Wrappers (Required Functions)
```python
def cut_clip(source_video: str, start_time: str, end_time: str, output_path: str) -> None
def create_intro(hook_text: str, background_image: Optional[str], duration: float, output_path: str) -> None
def burn_subtitles(video_path: str, subtitle_ass: str, output_path: str) -> None
def create_outro(hook_text: str, duration: float, logo_image: Optional[str], output_path: str) -> None
def stitch_video(clips: List[str], intro_path: str, outro_path: str, output_path: str) -> None
```

Each function must be independent and reusable for any project.

### Subtitle Processing (pysubs2)
- Load SRT file
- Extract subtitle events within clip timestamps (start/end)
- Shift timestamps so subtitles start at 0 in the clip
- Generate temporary ASS subtitle file
- Burn ASS into video with FFmpeg
- If transcript already exists in project.json, regenerate subtitles from transcript timestamps

### API Endpoints
```
POST /projects/create          # Create new project with uploads
POST /projects/import-scenes   # Import AI-generated scene JSON
GET /projects/{id}             # Get project details
POST /projects/{id}/cut        # Cut clips from source video
POST /projects/{id}/stitch     # Add branding and produce final videos
POST /projects/{id}/clip/{clipId}/recut  # Recut a specific clip
POST /projects/{id}/clip/{clipId}/restitch # Restitch a specific clip
```

### Frontend Pages
1. **Dashboard** — Show all projects
2. **Project View** — Project details, source video, subtitle status, clip count, progress bar
3. **Clips Table** — List of clips with all columns and action buttons
4. **Branding Settings** — Editable branding configuration saved to project.json

### Cross-Platform Considerations
- FFmpeg must be installed and available on PATH
- Path separators handled appropriately (os.path or pathlib)
- Windows/macOS/Linux test coverage
- No Docker — native execution only

### Documentation
- `backend/README.md` — Python installation, virtual environment, pip install, FFmpeg installation, run FastAPI server
- `frontend/README.md` — npm install, npm run dev
- Root `README.md` — Complete workflow from project creation to final export

---

## 5. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| FFmpeg not installed | High | High | Setup guide with explicit FFmpeg installation instructions; check FFmpeg availability at app startup; clear error messages |
| SRT parsing errors | Medium | Medium | Validate SRT format before processing; fallback subtitle handling; unit tests for pysubs2 integration |
| Timestamp format mismatches | Medium | High | Normalize all timestamps to HH:MM:SS.mmm format; strict validation on API inputs; clear error messages on mismatch |
| Large video file performance | Medium | Medium | Progress indicators during FFmpeg; consider file size warnings; optimize FFmpeg commands |
| Memory usage with long videos | Low | High | Process clips in segments; avoid loading entire video into memory; FFmpeg subprocess streaming |
| Tailwind dark mode issues | Low | Low | Test dark mode across components; use Tailwind's `dark:` class strategy; fallback light mode if issues arise |
| Cross-platform path issues | Medium | Medium | Use Python pathlib; test on all target platforms; clear error messages for path-related failures |
| Scope creep (adding features early) | High | High | Strict phase gates; documented out-of-scope items; phase review before moving to next phase |
| project.json corruption | Low | High | Read-only operations where possible; backup before major mutations; validation on load; error recovery paths |

---

## 6. Next Steps

### Immediate (This Sprint)
1. ✅ Finalize project plan (this document)
2. ✅ Set up repository structure: `cocktailclips/frontend`, `cocktailclips/backend`, `cocktailclips/projects/`
3. ✅ Implement backend `POST /projects/create` endpoint
4. ✅ Create frontend Project Creation UI component
5. ✅ Write `backend/README.md` and `frontend/README.md`
6. ✅ Test end-to-end: create project, upload video + SRT, verify project.json generated

### Short-Term (Phase 1 Complete)
1. Implement `POST /projects/import-scenes` endpoint
2. Build AI Scene Import UI
3. Complete documentation for project creation workflow

### Medium-Term (Phase 2 Complete)
1. Implement FFmpeg `cut_clip()` wrapper
2. Integrate pysubs2 subtitle extraction
3. Build Clips Table frontend page
4. Test clip cutting workflow end-to-end

### Long-Term (Phase 3-4 Complete)
1. Implement full Stitch/Branding tool
2. Add progress indicators throughout
3. Cross-platform testing and polishing
4. Add extension points for YouTube/TikTok publishing
5. Final documentation and user guide

---

## 7. Success Metrics

- [ ] User can create a project from uploads in under 5 minutes
- [ ] Clip cutting produces correct video segment with accurate subtitles
- [ ] Stitching adds intro/outro/logos/subtitles correctly
- [ ] Final exported videos play without errors
- [ ] Application runs on macOS, Linux, and Windows
- [ ] All FFmpeg operations show progress indicators
- [ ] Documentation is complete and accurate
- [ ] Code has appropriate type hints and error handling
- [ ] Extension points added for future YouTube/TikTok publishing
- [ ] No Docker dependency — native execution only