# CocktailClips Backend

FastAPI-based backend for the CocktailClips local AI video clipper application.

## Getting Started

### Prerequisites
- Python 3.11+
- FFmpeg installed and available on PATH
- pip

### Virtual Environment

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
```

### Install Dependencies

```powershell
pip install -r requirements.txt
```

### Verify FFmpeg

```powershell
ffmpeg -version
```

### Run FastAPI Server

```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.

## Dependencies

See `requirements.txt`:
- `fastapi>=0.100.0` — Web framework
- `uvicorn[standard]>=0.27.0` — ASGI server
- `pysubs2>=5.0.0` — Subtitle processing
- `ffmpeg-python>=0.2.0` — FFmpeg Python bindings
- `python-multipart>=0.0.6` — Form data parsing

## API Endpoints

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

## Key Modules

- `app/main.py` — FastAPI app with all endpoints
- `app/cut_clip.py` — FFmpeg clip cutter wrapper with timestamp parsing
- `app/stitch_video.py` — FFmpeg stitching wrapper with progress tracking
- `app/pysubs2_integration.py` — Subtitle extraction, shifting, ASS generation, and burning
- `app/publish_video.py` — Publishing features (extensible for YouTube, TikTok, etc.)

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app with all endpoints
│   ├── cut_clip.py          # FFmpeg clip cutter wrapper
│   ├── stitch_video.py      # FFmpeg stitching wrapper
│   ├── pysubs2_integration.py # Subtitle extraction & burning
│   └── publish_video.py     # Publishing features
├── projects/                # Generated project directories
├── requirements.txt
└── venv/                    # Virtual environment
```

## FFmpeg Wrappers

### cut_clip()
Cuts a video clip from source video between start/end timestamps using FFmpeg.

### stitch_video()
Concatenates intro + clips + outro into a final branded video with optional logo overlay.

### burn_subtitles_ffmpeg()
Burns ASS subtitles into video using FFmpeg's subtitles filter.

### extract_subtitles_srt()
Extracts subtitle events from SRT file within clip timestamps using pysubs2.

### shift_subtitle_timestamps()
Shifts subtitle timestamps so they start at 0 in the clip.

### generate_ass_file()
Generates an ASS subtitle file from extracted subtitle events.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `FFmpeg not found` | Install FFmpeg and ensure it's on PATH |
| `Module not found` | `pip install -r requirements.txt` |
| `pysubs2 not installed` | `pip install pysubs2` |
| `CORS error` | Ensure frontend dev server proxy is configured |
| `Stitching fails` | Verify all clip files have status "cut" |

## Extensibility

The backend is designed to be easily extended with:
- YouTube/TikTok publishing features
- AI scene detection
- Additional video processing tools
- Database integration for project management
