"""Backend for CocktailClips — Local AI Video Clipper.

FastAPI-based backend that handles:
- Project creation with video + subtitle uploads
- project.json management
- Clip cutting (FFmpeg wrapper - Phase 2)
- Stitch/branding (Phase 3)
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import uvicorn
import json
import os
import uuid
import tempfile
import subprocess
import re
import ffmpeg
from pathlib import Path
from typing import Optional
from datetime import datetime, timezone

from .cut_clip import cut_clip, parse_timestamp_to_seconds, validate_timestamp_format
from .stitch_video import stitch_video, get_video_duration, validate_video_file
from .pysubs2_integration import extract_subtitles_srt, shift_subtitle_timestamps, generate_ass_file, burn_subtitles_ffmpeg
from .media_import import MediaImportError, download_media, fetch_metadata

app = FastAPI(
    title="CocktailClips Backend",
    description="Local AI Video Clipper — Backend API",
    version="0.1.0"
)

# Allow the Vite dev server and local desktop-style clients to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base directory for all projects
BASE_DIR = Path("projects")
BASE_DIR.mkdir(parents=True, exist_ok=True)
IMPORT_JOBS: dict[str, dict] = {}


def _new_project_data(project_id: str, project_name: str, source: dict) -> dict:
    return {
        "project": {"id": project_id, "name": project_name},
        "source": source,
        "branding": {"intro_duration": 1.5, "hook_duration": 1.5, "outro_duration": 1.5, "opening_image": None, "closing_image": None},
        "clips": [],
    }


@app.get("/")
async def root():
    """Root endpoint returning API info."""
    return {
        "message": "CocktailClips Backend is running",
        "version": "0.1.0",
        "endpoints": [
            "/",
            "/projects/create",
            "/projects/import-scenes",
            "/projects/{project_id}",
            "/projects/{id}/cut",
            "/projects/{id}/stitch"
        ]
    }


@app.post("/projects/create")
async def create_project(
    video: UploadFile = File(...),
    subtitle: Optional[UploadFile] = File(None),
    project_name: str = Form(...)
):
    """Create a new project with uploaded video and subtitle files.

    Args:
        video: MP4 video file upload
        subtitle: SRT subtitle file upload
        project_name: User-provided project name

    Returns:
        JSON response with project ID and status
    """
    # Validate video file type
    if not video.filename or not video.filename.lower().endswith(".mp4"):
        raise HTTPException(
            status_code=400,
            detail="Video file must be .mp4 format"
        )

    # Validate subtitle file type
    if subtitle and (not subtitle.filename or not subtitle.filename.lower().endswith(".srt")):
        raise HTTPException(
            status_code=400,
            detail="Subtitle file must be .srt format"
        )

    # Generate unique project ID
    project_id = str(uuid.uuid4())

    # Create project directory
    project_dir = BASE_DIR / project_id
    project_dir.mkdir(parents=True, exist_ok=True)

    # Save video file
    video_path = project_dir / "source.mp4"
    with open(video_path, "wb") as f:
        content = await video.read()
        f.write(content)

    # Save subtitle file
    if subtitle:
        subtitle_path = project_dir / "source.srt"
        with open(subtitle_path, "wb") as f:
            content = await subtitle.read()
            f.write(content)

    # Create initial project.json
    project_data = _new_project_data(project_id, project_name, {
        "type": "local", "video": "source.mp4", "subtitle": "source.srt" if subtitle else None,
        "original_filename": video.filename,
    })

    project_json_path = project_dir / "project.json"
    with open(project_json_path, "w") as f:
        json.dump(project_data, f, indent=2)

    return JSONResponse(
        content={
            "status": "success",
            "project_id": project_id,
            "message": "Project created successfully",
            "project_name": project_name
        },
        status_code=201
    )


def _normalise_timestamp(value: object) -> str:
    """Normalize common AI timestamp formats to HH:MM:SS.mmm."""
    if isinstance(value, (int, float)):
        total_ms = max(0, int(float(value) * 1000))
        hours, remainder = divmod(total_ms, 3_600_000)
        minutes, remainder = divmod(remainder, 60_000)
        seconds, milliseconds = divmod(remainder, 1_000)
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}.{milliseconds:03d}"

    timestamp = str(value or "").strip()
    parts = timestamp.split(":")
    if len(parts) == 2:
        timestamp = f"00:{timestamp}"
    if len(timestamp.split(".")) == 1:
        timestamp = f"{timestamp}.000"
    return timestamp


def _normalise_scene_plan(payload: object) -> list[dict]:
    """Convert common external-AI scene formats into project clip records."""
    if isinstance(payload, list):
        raw_clips = payload
    elif isinstance(payload, dict):
        raw_clips = payload.get("clips") or payload.get("scenes") or payload.get("segments")
    else:
        raw_clips = None

    if not isinstance(raw_clips, list) or not raw_clips:
        raise HTTPException(status_code=400, detail="Plan must contain a non-empty clips or scenes array")

    clips = []
    errors = []
    for index, raw in enumerate(raw_clips, start=1):
        if not isinstance(raw, dict):
            errors.append(f"Item {index} must be an object")
            continue

        start = _normalise_timestamp(raw.get("start") or raw.get("start_time") or raw.get("from"))
        end = _normalise_timestamp(raw.get("end") or raw.get("end_time") or raw.get("to"))
        try:
            start_seconds = parse_timestamp_to_seconds(start)
            end_seconds = parse_timestamp_to_seconds(end)
            if start_seconds >= end_seconds:
                raise ValueError("start must be before end")
        except (ValueError, TypeError) as exc:
            errors.append(f"Item {index}: invalid time range ({exc})")
            continue

        clip_id = str(raw.get("id") or f"{index:03d}")
        title = str(raw.get("title") or raw.get("summary") or raw.get("description") or f"Clip {index}")
        clips.append({
            "id": clip_id,
            "start": start,
            "end": end,
            "title": title,
            "hook": str(raw.get("hook") or ""),
            "next_hook": str(raw.get("next_hook") or raw.get("subscribe_text") or "Follow for more"),
            "transcript": str(raw.get("transcript") or ""),
            "clip_file": None,
            "final_file": None,
            "status": "planned",
            "include_in_stitch": True,
        })

    if errors:
        raise HTTPException(status_code=400, detail="; ".join(errors[:8]))
    return clips


@app.post("/projects/import-scenes")
async def import_scenes(
    project_id: str = Form(...),
    scenes_file: UploadFile = File(...)
):
    """Import and normalize a scene plan generated by an external AI tool."""
    project_dir = BASE_DIR / project_id
    if not project_dir.exists():
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    content = await scenes_file.read()
    try:
        scenes_data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format in scene plan")

    project_json_path = project_dir / "project.json"
    if not project_json_path.exists():
        raise HTTPException(status_code=404, detail="project.json not found in project directory")

    new_clips = _normalise_scene_plan(scenes_data)
    with open(project_json_path, "r") as f:
        project_data = json.load(f)

    # Re-importing a plan replaces the previous planned set instead of duplicating it.
    project_data["clips"] = new_clips
    project_data["scenes"] = [
        {
            "id": clip["id"],
            "index": index,
            "start": clip["start"],
            "end": clip["end"],
            "title": clip["title"],
            "summary": clip["title"],
            "tags": [],
            "selected": False,
        }
        for index, clip in enumerate(new_clips)
    ]

    with open(project_json_path, "w") as f:
        json.dump(project_data, f, indent=2)

    return JSONResponse(content={
        "status": "success",
        "message": "Scene plan imported successfully",
        "total_clips": len(new_clips),
        "project": project_data,
    })


@app.get("/projects")
async def list_projects():
    """List locally stored projects for the workspace project rail."""
    projects = []
    for project_dir in BASE_DIR.iterdir():
        if not project_dir.is_dir():
            continue
        project_json_path = project_dir / "project.json"
        if not project_json_path.exists():
            continue
        try:
            with open(project_json_path, "r") as f:
                data = json.load(f)
            clips = data.get("clips", [])
            projects.append({
                "id": data.get("project", {}).get("id", project_dir.name),
                "name": data.get("project", {}).get("name", project_dir.name),
                "clips": len(clips),
                "completed": sum(1 for clip in clips if clip.get("individual_render_status") == "completed" and str(clip.get("final_file") or "").startswith("final/clips/")),
                "updated_at": project_json_path.stat().st_mtime,
            })
        except (OSError, json.JSONDecodeError):
            continue
    projects.sort(key=lambda project: project["updated_at"], reverse=True)
    return JSONResponse(content={"projects": projects})


@app.get("/projects/{project_id}")
async def get_project(project_id: str):
    """Get project details by project ID.

    Args:
        project_id: UUID of the project

    Returns:
        JSON response with project details
    """
    project_dir = BASE_DIR / project_id
    project_json_path = project_dir / "project.json"

    if not project_dir.exists() or not project_json_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Project {project_id} not found"
        )

    with open(project_json_path, "r") as f:
        project_data = json.load(f)

    return JSONResponse(
        content=project_data
    )


@app.post("/projects/{project_id}/cut")
async def cut_project_clip(
    project_id: str,
    start_time: str = Form(...),
    end_time: str = Form(...),
    clip_title: str = Form(...)
):
    """Cut a clip from the source video using FFmpeg.

    Args:
        project_id: UUID of the project
        start_time: Start timestamp in HH:MM:SS.mmm format
        end_time: End timestamp in HH:MM:SS.mmm format
        clip_title: Title/ID for the clip being cut

    Returns:
        JSON response with cut status and clip file path
    """
    project_dir = BASE_DIR / project_id
    if not project_dir.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Project {project_id} not found"
        )

    # Validate timestamp format
    if not validate_timestamp_format(start_time):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid start_time format: {start_time}. Expected HH:MM:SS.mmm"
        )

    if not validate_timestamp_format(end_time):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid end_time format: {end_time}. Expected HH:MM:SS.mmm"
        )

    # Parse timestamps to validate start < end
    try:
        start_seconds = parse_timestamp_to_seconds(start_time)
        end_seconds = parse_timestamp_to_seconds(end_time)

        if start_seconds >= end_seconds:
            raise HTTPException(
                status_code=400,
                detail=f"start_time ({start_time}) must be before end_time ({end_time})"
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Read project.json to get current state
    project_json_path = project_dir / "project.json"
    with open(project_json_path, "r") as f:
        project_data = json.load(f)

    # Determine clip file name
    clip_index = len(project_data["clips"]) + 1
    clip_file_name = f"0{clip_index}.mp4" if clip_index < 10 else f"{clip_index}.mp4"
    clip_output_path = project_dir / "clips" / clip_file_name

    # Ensure clips directory exists
    clip_output_path.parent.mkdir(parents=True, exist_ok=True)

    # Cut the clip using FFmpeg wrapper
    result = cut_clip(
        source_video=str(project_dir / "source.mp4"),
        start_time=start_time,
        end_time=end_time,
        output_path=str(clip_output_path)
    )

    if result is None:
        raise HTTPException(
            status_code=500,
            detail="Failed to cut clip using FFmpeg. Check that FFmpeg is installed and accessible."
        )

    # Extract and burn subtitles if source.srt exists
    srt_path = project_dir / "source.srt"
    if srt_path.exists():
        try:
            ssa_file = extract_subtitles_srt(str(srt_path), start_time, end_time)
            if ssa_file and len(ssa_file.events) > 0:
                shifted_ssa = shift_subtitle_timestamps(ssa_file, parse_timestamp_to_seconds(start_time))
                ass_path = project_dir / "clips" / f"{clip_file_name}.ass"
                ass_path.parent.mkdir(parents=True, exist_ok=True)
                if generate_ass_file(shifted_ssa, str(ass_path)):
                    burn_subtitles_ffmpeg(str(clip_output_path), str(ass_path), str(clip_output_path))
        except Exception as e:
            print(f"Subtitle processing failed: {e}")

    # Update project.json with clip information
    new_clip = {
        "id": clip_title or f"clip_{clip_index}",
        "start": start_time,
        "end": end_time,
        "title": clip_title or f"Clip {clip_index}",
        "hook": "",
        "next_hook": "",
        "transcript": "",
        "clip_file": clip_file_name,
        "final_file": None,
        "status": "cut"
    }

    # Add or update clip in the clips array
    # Check if clip with same start/end already exists
    existing_clip_index = None
    for i, existing_clip in enumerate(project_data["clips"]):
        if existing_clip.get("start") == start_time and existing_clip.get("end") == end_time:
            existing_clip_index = i
            break

    if existing_clip_index is not None:
        # Update existing clip
        project_data["clips"][existing_clip_index] = new_clip
    else:
        # Add new clip
        project_data["clips"].append(new_clip)

    # Write updated project.json
    with open(project_json_path, "w") as f:
        json.dump(project_data, f, indent=2)

    return JSONResponse(
        content={
            "status": "success",
            "message": "Clip cut successfully",
            "clip_id": new_clip["id"],
            "clip_file": new_clip["clip_file"],
            "clip_output_path": str(clip_output_path),
            "start": start_time,
            "end": end_time,
            "title": new_clip["title"]
        }
    )


@app.post("/projects/{project_id}/cut-all")
async def cut_all_project_clips(project_id: str):
    """Cut every planned clip in the imported AI scene plan."""
    project_dir = BASE_DIR / project_id
    project_json_path = project_dir / "project.json"
    source_path = project_dir / "source.mp4"

    if not project_dir.exists() or not project_json_path.exists():
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    if not source_path.exists():
        raise HTTPException(status_code=400, detail="Source video is missing from the project")

    with open(project_json_path, "r") as f:
        project_data = json.load(f)

    clips = project_data.get("clips", [])
    if not clips:
        raise HTTPException(status_code=400, detail="Import an AI scene plan before cutting clips")

    clips_dir = project_dir / "clips"
    clips_dir.mkdir(parents=True, exist_ok=True)
    srt_path = project_dir / "source.srt"
    completed = 0
    failed = 0
    results = []

    for index, clip in enumerate(clips, start=1):
        if clip.get("status") == "cut" and clip.get("clip_file") and (clips_dir / clip["clip_file"]).exists():
            completed += 1
            results.append({"id": clip.get("id"), "status": "cut", "clip_file": clip.get("clip_file")})
            continue

        clip["status"] = "processing"
        clip["error"] = None
        output_name = f"{index:03d}.mp4"
        output_path = clips_dir / output_name
        try:
            start = clip.get("start", "")
            end = clip.get("end", "")
            if not validate_timestamp_format(start) or not validate_timestamp_format(end):
                raise ValueError("timestamps must use HH:MM:SS.mmm format")
            if parse_timestamp_to_seconds(start) >= parse_timestamp_to_seconds(end):
                raise ValueError("start must be before end")

            result = cut_clip(
                source_video=str(source_path),
                start_time=start,
                end_time=end,
                output_path=str(output_path),
            )
            if result is None or not output_path.exists():
                raise RuntimeError("FFmpeg did not create the clip file")

            if srt_path.exists():
                try:
                    subtitle_file = extract_subtitles_srt(str(srt_path), start, end)
                    if subtitle_file and getattr(subtitle_file, "events", None):
                        clip["transcript"] = "\n".join(event.text for event in subtitle_file.events)
                        shifted = shift_subtitle_timestamps(subtitle_file, parse_timestamp_to_seconds(start))
                        ass_path = clips_dir / f"{output_name}.ass"
                        if generate_ass_file(shifted, str(ass_path)):
                            burn_subtitles_ffmpeg(str(output_path), str(ass_path), str(output_path))
                except Exception as subtitle_error:
                    # Cutting remains successful if optional subtitle processing fails.
                    clip["subtitle_error"] = str(subtitle_error)

            clip["clip_file"] = output_name
            clip["status"] = "cut"
            clip["error"] = None
            completed += 1
            results.append({"id": clip.get("id"), "status": "cut", "clip_file": output_name})
        except Exception as error:
            clip["status"] = "failed"
            clip["error"] = str(error)
            failed += 1
            results.append({"id": clip.get("id"), "status": "failed", "error": str(error)})

        with open(project_json_path, "w") as f:
            json.dump(project_data, f, indent=2)

    return JSONResponse(content={
        "status": "success" if failed == 0 else "partial", 
        "message": "Clip cutting completed" if failed == 0 else "Some clips could not be cut",
        "total": len(clips),
        "completed": completed,
        "failed": failed,
        "results": results,
        "project": project_data,
    }, status_code=500 if completed == 0 else 200)


def _drawtext_value(value: str) -> str:
    return str(value or "").replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'").replace("%", "\\%")


def _find_fontfile() -> Optional[str]:
    """Find an explicit font so drawtext does not depend on Fontconfig."""
    candidates = [
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/segoeui.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"),
        Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
    ]
    return next((str(path) for path in candidates if path.exists()), None)


def _drawtext_font_option() -> str:
    fontfile = _find_fontfile()
    return f"fontfile='{_drawtext_value(fontfile)}':" if fontfile else ""


def _run_ffmpeg(args: list[str]) -> None:
    completed = subprocess.run(["ffmpeg", "-y", *args], capture_output=True, text=True)
    if completed.returncode != 0:
        detail = completed.stderr[-1200:] if completed.stderr else "FFmpeg failed"
        raise RuntimeError(detail)


def _branding_asset_path(project_dir: Path, branding: dict, key: str) -> Optional[Path]:
    """Resolve a persisted branding asset while keeping it inside the project."""
    relative_path = branding.get(key)
    if not relative_path:
        return None
    candidate = (project_dir / str(relative_path)).resolve()
    try:
        candidate.relative_to(project_dir.resolve())
    except ValueError:
        return None
    return candidate if candidate.is_file() else None


def _render_still_image(image_path: Path, output_path: Path, duration: float) -> None:
    """Turn a branding still into a silent 1080x1920 video segment."""
    image_filter = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1"
    _run_ffmpeg([
        "-loop", "1", "-i", str(image_path),
        "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
        "-t", str(duration), "-vf", image_filter, "-r", "30",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest",
        str(output_path),
    ])


def _render_individual_clip(project_dir: Path, clip: dict, branding: dict, output_path: Path) -> None:
    """Render one opening image + normalized clip + closing image file."""
    clip_id = re.sub(r"[^A-Za-z0-9_-]", "_", str(clip.get("id", "clip")))
    work_dir = project_dir / "rendered" / "individual" / clip_id
    work_dir.mkdir(parents=True, exist_ok=True)
    source_clip = project_dir / "clips" / clip["clip_file"]
    hook_duration = float(branding.get("hook_duration", 1.5))
    outro_duration = float(branding.get("outro_duration", 1.5))
    opening_image = _branding_asset_path(project_dir, branding, "opening_image")
    closing_image = _branding_asset_path(project_dir, branding, "closing_image")
    if not opening_image or not closing_image:
        raise RuntimeError("Upload both opening and closing branding images before rendering")

    hook_path = work_dir / "opening.mp4"
    _render_still_image(opening_image, hook_path, hook_duration)

    normalized_path = work_dir / "clip.mp4"
    normalize_filter = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1"
    _run_ffmpeg(["-i", str(source_clip), "-vf", normalize_filter, "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ar", "48000", "-ac", "2", str(normalized_path)])

    outro_path = work_dir / "closing.mp4"
    _render_still_image(closing_image, outro_path, outro_duration)

    concat_list = work_dir / "segments.txt"
    entries = [hook_path, normalized_path, outro_path]
    concat_list.write_text("\n".join(f"file '{str(path.resolve()).replace(chr(92), '/').replace(chr(39), chr(39) + chr(92) + chr(39))}'" for path in entries), encoding="utf-8")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    _run_ffmpeg(["-f", "concat", "-safe", "0", "-i", str(concat_list), "-c", "copy", "-movflags", "+faststart", str(output_path)])
    if not output_path.exists() or output_path.stat().st_size == 0:
        raise RuntimeError("FFmpeg did not create the individual rendered clip")


@app.post("/projects/{project_id}/branding")
async def update_branding(
    project_id: str,
    hook_duration: Optional[float] = Form(default=None),
    outro_duration: Optional[float] = Form(default=None),
    opening_image: Optional[UploadFile] = File(default=None),
    closing_image: Optional[UploadFile] = File(default=None),
):
    """Save opening/closing artwork and durations used by the reel renderer."""
    project_dir = BASE_DIR / project_id
    project_json_path = project_dir / "project.json"
    if not project_dir.exists() or not project_json_path.exists():
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    with open(project_json_path, "r") as f:
        project_data = json.load(f)
    branding = project_data.setdefault("branding", {})
    if hook_duration is not None:
        if not 0.5 <= hook_duration <= 10:
            raise HTTPException(status_code=400, detail="Hook duration must be between 0.5 and 10 seconds")
        branding["hook_duration"] = hook_duration
    if outro_duration is not None:
        if not 0.5 <= outro_duration <= 10:
            raise HTTPException(status_code=400, detail="Outro duration must be between 0.5 and 10 seconds")
        branding["outro_duration"] = outro_duration

    assets_dir = project_dir / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)
    allowed_extensions = {".png", ".jpg", ".jpeg", ".webp"}
    for field_name, upload in (("opening_image", opening_image), ("closing_image", closing_image)):
        if upload is None:
            continue
        extension = Path(upload.filename or "").suffix.lower()
        if extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Branding images must be PNG, JPG, JPEG, or WebP")
        destination = assets_dir / f"{'opening' if field_name == 'opening_image' else 'closing'}{extension}"
        destination.write_bytes(await upload.read())
        if destination.stat().st_size == 0:
            destination.unlink(missing_ok=True)
            raise HTTPException(status_code=400, detail="Uploaded branding image is empty")
        branding[field_name] = destination.relative_to(project_dir).as_posix()

    project_data["output"] = {"file": None, "status": "not_started"}
    with open(project_json_path, "w") as f:
        json.dump(project_data, f, indent=2)
    return JSONResponse(content={"status": "success", "project": project_data})


@app.get("/projects/{project_id}/branding/{slot}")
async def get_branding_image(project_id: str, slot: str):
    """Return the persisted opening or closing artwork for UI previews."""
    if slot not in {"opening", "closing"}:
        raise HTTPException(status_code=404, detail="Branding image not found")
    project_dir = BASE_DIR / project_id
    project_json_path = project_dir / "project.json"
    if not project_json_path.exists():
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    with open(project_json_path, "r") as f:
        project_data = json.load(f)
    image_path = _branding_asset_path(project_dir, project_data.get("branding", {}), f"{slot}_image")
    if not image_path:
        raise HTTPException(status_code=404, detail="Branding image not found")
    return FileResponse(path=image_path)


@app.post("/projects/{project_id}/render-reel")
async def render_reel(project_id: str):
    """Render one vertical opening image + clips + closing image reel."""
    project_dir = BASE_DIR / project_id
    project_json_path = project_dir / "project.json"
    if not project_dir.exists() or not project_json_path.exists():
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    with open(project_json_path, "r") as f:
        project_data = json.load(f)

    clips = [clip for clip in project_data.get("clips", []) if clip.get("include_in_stitch", True)]
    if not clips:
        raise HTTPException(status_code=400, detail="No clips are included in the reel")
    missing = [clip.get("id", "unknown") for clip in clips if clip.get("status") != "cut" or not clip.get("clip_file") or not (project_dir / "clips" / clip["clip_file"]).exists()]
    if missing:
        raise HTTPException(status_code=400, detail=f"Cut these clips before rendering: {', '.join(missing)}")

    branding = project_data.get("branding", {})
    hook_duration = float(branding.get("hook_duration", 1.5))
    outro_duration = float(branding.get("outro_duration", 1.5))
    opening_image = _branding_asset_path(project_dir, branding, "opening_image")
    closing_image = _branding_asset_path(project_dir, branding, "closing_image")
    if not opening_image or not closing_image:
        raise HTTPException(status_code=400, detail="Upload both opening and closing branding images before rendering")
    render_dir = project_dir / "rendered"
    final_dir = project_dir / "final"
    render_dir.mkdir(parents=True, exist_ok=True)
    final_dir.mkdir(parents=True, exist_ok=True)

    try:
        hook_path = render_dir / "opening.mp4"
        _render_still_image(opening_image, hook_path, hook_duration)

        segment_paths = [hook_path]
        for index, clip in enumerate(clips, start=1):
            input_path = project_dir / "clips" / clip["clip_file"]
            segment_path = render_dir / f"clip-{index:03d}.mp4"
            normalize_filter = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1"
            _run_ffmpeg(["-i", str(input_path), "-vf", normalize_filter, "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ar", "48000", "-ac", "2", str(segment_path)])
            segment_paths.append(segment_path)

        outro_path = render_dir / "closing.mp4"
        _render_still_image(closing_image, outro_path, outro_duration)
        segment_paths.append(outro_path)

        concat_list = render_dir / "segments.txt"
        concat_entries = []
        for path in segment_paths:
            absolute_path = str(path.resolve()).replace("\\", "/").replace("'", "'\\''")
            concat_entries.append(f"file '{absolute_path}'")
        concat_list.write_text("\n".join(concat_entries), encoding="utf-8")
        output_path = final_dir / "reel.mp4"
        _run_ffmpeg(["-f", "concat", "-safe", "0", "-i", str(concat_list), "-c", "copy", "-movflags", "+faststart", str(output_path)])
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Reel rendering failed: {error}") from error

    if not output_path.exists() or output_path.stat().st_size == 0:
        raise HTTPException(status_code=500, detail="FFmpeg completed without creating a valid reel file")

    project_data["output"] = {"file": "final/reel.mp4", "status": "completed", "width": 1080, "height": 1920, "size_bytes": output_path.stat().st_size}
    for clip in clips:
        clip["final_file"] = "final/reel.mp4"
        clip["status"] = "completed"
    with open(project_json_path, "w") as f:
        json.dump(project_data, f, indent=2)

    return JSONResponse(content={"status": "success", "message": "Reel rendered successfully", "output": project_data["output"], "project": project_data})


@app.post("/projects/{project_id}/render-clips")
async def render_selected_clips(project_id: str, clip_ids: list[str] = Body(..., embed=True)):
    """Render selected cut clips as separate branded vertical MP4 files."""
    project_dir = BASE_DIR / project_id
    project_json_path = project_dir / "project.json"
    if not project_dir.exists() or not project_json_path.exists():
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    if not clip_ids:
        raise HTTPException(status_code=400, detail="Select at least one clip to render")

    with open(project_json_path, "r") as f:
        project_data = json.load(f)
    clips_by_id = {str(clip.get("id")): clip for clip in project_data.get("clips", [])}
    selected = [clips_by_id[clip_id] for clip_id in clip_ids if clip_id in clips_by_id]
    missing_ids = [clip_id for clip_id in clip_ids if clip_id not in clips_by_id]
    if missing_ids:
        raise HTTPException(status_code=404, detail=f"Clips not found: {', '.join(missing_ids)}")
    uncut = [clip.get("id", "unknown") for clip in selected if clip.get("status") not in {"cut", "completed"} or not clip.get("clip_file") or not (project_dir / "clips" / clip["clip_file"]).exists()]
    if uncut:
        raise HTTPException(status_code=400, detail=f"Cut these clips before rendering: {', '.join(uncut)}")

    branding = project_data.get("branding", {})
    rendered = []
    errors = []
    for clip in selected:
        safe_id = re.sub(r"[^A-Za-z0-9_-]", "_", str(clip["id"]))
        output_name = f"{safe_id}.mp4"
        output_path = project_dir / "final" / "clips" / output_name
        try:
            _render_individual_clip(project_dir, clip, branding, output_path)
            clip["final_file"] = f"final/clips/{output_name}"
            clip["individual_render_status"] = "completed"
            clip.pop("render_error", None)
            rendered.append({"id": clip["id"], "file": clip["final_file"], "size_bytes": output_path.stat().st_size})
        except Exception as error:
            clip["individual_render_status"] = "failed"
            clip["render_error"] = str(error)
            errors.append({"id": clip["id"], "error": str(error)})

    with open(project_json_path, "w") as f:
        json.dump(project_data, f, indent=2)
    return JSONResponse(content={"status": "success" if rendered and not errors else "partial" if rendered else "failed", "rendered": rendered, "errors": errors, "project": project_data}, status_code=200 if rendered else 500)


@app.get("/projects/{project_id}/clips/{clip_id}/download")
async def download_rendered_clip(project_id: str, clip_id: str):
    project_dir = BASE_DIR / project_id
    project_json_path = project_dir / "project.json"
    if not project_json_path.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    with open(project_json_path, "r") as f:
        project_data = json.load(f)
    clip = next((item for item in project_data.get("clips", []) if str(item.get("id")) == clip_id), None)
    if not clip or not clip.get("final_file") or not str(clip["final_file"]).startswith("final/clips/"):
        raise HTTPException(status_code=404, detail="Individual rendered clip not found")
    output_path = project_dir / clip["final_file"]
    if not output_path.exists():
        raise HTTPException(status_code=404, detail="Individual rendered clip file not found")
    return FileResponse(str(output_path), media_type="video/mp4", filename=output_path.name)


@app.get("/projects/{project_id}/clips/{clip_id}/rendered-preview")
async def preview_rendered_clip(project_id: str, clip_id: str):
    """Stream a branded clip inline without triggering a browser download."""
    project_dir = BASE_DIR / project_id
    project_json_path = project_dir / "project.json"
    if not project_json_path.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    with open(project_json_path, "r") as f:
        project_data = json.load(f)
    clip = next((item for item in project_data.get("clips", []) if str(item.get("id")) == clip_id), None)
    final_file = str(clip.get("final_file") or "") if clip else ""
    if not final_file.startswith("final/clips/"):
        raise HTTPException(status_code=404, detail="Individual rendered clip not found")
    output_path = (project_dir / final_file).resolve()
    try:
        output_path.relative_to(project_dir.resolve())
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Invalid rendered clip path") from error
    if not output_path.is_file():
        raise HTTPException(status_code=404, detail="Individual rendered clip file not found")
    return FileResponse(str(output_path), media_type="video/mp4", headers={"Content-Disposition": f'inline; filename="{output_path.name}"', "Cache-Control": "no-store"})


@app.post("/projects/{project_id}/stitch")
async def stitch_project(
    project_id: str,
    logo_override: str = Form(default=None)
):
    """Stitch all clips for a project into final branded videos.

    Reads all clips from project.json, generates intro/outro from hook texts,
    and combines them using FFmpeg. Adds logo overlay if available.

    Args:
        project_id: UUID of the project
        logo_override: Optional logo file path to force logo usage

    Returns:
        JSON response with stitch status and final video path
    """
    project_dir = BASE_DIR / project_id
    if not project_dir.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Project {project_id} not found"
        )

    # Read project.json to get current state
    project_json_path = project_dir / "project.json"
    if not project_json_path.exists():
        raise HTTPException(
            status_code=404,
            detail="project.json not found in project directory"
        )

    with open(project_json_path, "r") as f:
        project_data = json.load(f)

    clips_list = project_data.get("clips", [])

    if not clips_list:
        raise HTTPException(
            status_code=400,
            detail="No clips found in project. Please cut clips first."
        )

    # Check if all clips have been cut
    uncut_clips = [c for c in clips_list if c.get("status") != "cut"]
    if uncut_clips:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot stitch project: {len(uncut_clips)} clip(s) are not yet cut. Please cut all clips first."
        )

    # Get project branding config
    branding = project_data.get("branding", {})
    channel_name = branding.get("channel", "CocktailClips")
    intro_duration = branding.get("intro_duration", 2)
    outro_duration = branding.get("outro_duration", 2)
    outro_text = branding.get("outro_text", "Follow for Part 2")

    # Determine logo path
    # Look for logo in project directory or assets
    logo_path = None
    assets_dir = Path("assets")
    
    # Check for logo in common locations
    possible_logo_paths = [
        assets_dir / "logo.png",
        assets_dir / "logo.jpg",
        project_dir / "logo.png",
        project_dir / "logo.jpg",
    ]
    
    for lp in possible_logo_paths:
        if lp.exists():
            logo_path = str(lp)
            break
    
    # Also check if logo_override was provided
    if logo_override and os.path.exists(logo_override):
        logo_path = logo_override

    # Create intro video using FFmpeg
    # Intro: black screen with channel name text and hook concept
    intro_output = project_dir / "intro.mp4"
    
    try:
        # Generate a simple intro with text
        # Using ffmpeg to create a solid color background with text
        duration = intro_duration
        
        # First, try to use existing intro.png if available
        intro_image = assets_dir / "intro.png"
        outro_image = assets_dir / "outro.png"
        
        if intro_image.exists():
            # Use intro.png as the intro background
            (
                ffmpeg.input(str(intro_image), t=duration)
                .output(str(intro_output), 
                       vf=f"drawtext=text='{channel_name}':fontsize=24:fontcolor=white:x=(w-text_width/2):y=(h-text_height-10)",
                       codec="libx264")
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
        else:
            # Create a simple colored background with text
            (
                ffmpeg.input('color=c=black:d=duration', f='lavfi', t=duration)
                .output(str(intro_output), 
                       vf=f"drawtext=text='{channel_name}':fontsize=24:fontcolor=white:x=(w-text_width/2):y=(h-text_height-10)",
                       codec="libx264")
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
        
        intro_path = str(intro_output)
    except Exception as e:
        # Fallback: create a minimal intro
        intro_path = None
        print(f"Could not generate intro video: {e}")

    # Create outro video
    outro_output = project_dir / "outro.mp4"
    
    try:
        # Similar to intro but with outro_text
        outro_image = assets_dir / "outro.png"
        
        if outro_image.exists():
            (
                ffmpeg.input(str(outro_image), t=outro_duration)
                .output(str(outro_output), 
                       vf=f'drawtext=text="{outro_text}":fontsize=24:fontcolor=white:x=(w-text_width/2):y=(h-text_height-10)',
                       codec="libx264")
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
        else:
            (
                ffmpeg.input('color=c=black:d=duration', f='lavfi', t=outro_duration)
                .output(str(outro_output), 
                       vf=f'drawtext=text="{outro_text}":fontsize=24:fontcolor=white:x=(w-text_width/2):y=(h-text_height-10)',
                       codec="libx264")
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
        
        outro_path = str(outro_output)
    except Exception as e:
        outro_path = None
        print(f"Could not generate outro video: {e}")

    # Prepare clip file paths
    clip_paths = []
    for clip in clips_list:
        clip_file = clip.get("clip_file")
        if clip_file and os.path.exists(project_dir / "clips" / clip_file):
            clip_paths.append(str(project_dir / "clips" / clip_file))
        else:
            # Skip clips that don't have file
            print(f"Clip file not found: {clip_file}")

    # Stitch everything together
    if intro_path and outro_path and clip_paths:
        output_filename = f"final_{clips_list[0]['id'] or '001'}.mp4"
        output_path = str(project_dir / "final" / output_filename)
        
        result = stitch_video(
            clips=clip_paths,
            intro_path=intro_path,
            outro_path=outro_path,
            output_path=output_path,
            logo_path=logo_path,
            logo_size="150x150"
        )
        
        if result is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to stitch video. Check FFmpeg logs for details."
            )
    else:
        # If we couldn't create intro/outro, just concatenate clips
        if clip_paths:
            output_filename = f"final_{clips_list[0]['id'] or '001'}.mp4"
            output_path = str(project_dir / "final" / output_filename)
            
            # Simple concatenation without intro/outro
            try:
                # Build filter complex for concatenating clips
                # For now, just use the first clip as output
                # In a full implementation, would concatenate all clips
                import shutil
                shutil.copy2(clip_paths[0], output_path)
                result = output_path
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to process clips: {e}"
                )
        else:
            raise HTTPException(
                status_code=400,
                detail="No clip files found to stitch."
            )

    # Update project.json with final file info
    final_file_name = os.path.basename(output_path)
    
    # Update each clip's final_file and status
    for clip in clips_list:
        clip["final_file"] = final_file_name
        clip["status"] = "completed"
    
    # Write updated project.json
    with open(project_json_path, "w") as f:
        json.dump(project_data, f, indent=2)

    return JSONResponse(
        content={
            "status": "success",
            "message": "Project stitched successfully",
            "final_file": final_file_name,
            "output_path": output_path,
            "project_name": project_data.get("project", {}).get("name", "Unknown"),
            "total_clips": len(clips_list),
            "intro_used": intro_path is not None,
            "outro_used": outro_path is not None,
            "logo_used": logo_path is not None
        }
    )


@app.post("/projects/{project_id}/clip/{clip_id}/recut")
async def recut_clip(
    project_id: str,
    clip_id: str,
    start_time: str = Form(...),
    end_time: str = Form(...),
    clip_title: str = Form(...)
):
    """Recut an existing clip with new timestamps.

    Args:
        project_id: UUID of the project
        clip_id: ID of the clip to recut
        start_time: New start timestamp in HH:MM:SS.mmm format
        end_time: New end timestamp in HH:MM:SS.mmm format
        clip_title: New title for the clip

    Returns:
        JSON response with recut status
    """
    project_dir = BASE_DIR / project_id
    if not project_dir.exists():
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    project_json_path = project_dir / "project.json"
    if not project_json_path.exists():
        raise HTTPException(status_code=404, detail="project.json not found")

    with open(project_json_path, "r") as f:
        project_data = json.load(f)

    # Find the clip
    clip_index = None
    for i, clip in enumerate(project_data["clips"]):
        if clip.get("id") == clip_id:
            clip_index = i
            break

    if clip_index is None:
        raise HTTPException(status_code=404, detail=f"Clip {clip_id} not found")

    # Validate timestamps
    if not validate_timestamp_format(start_time) or not validate_timestamp_format(end_time):
        raise HTTPException(status_code=400, detail="Invalid timestamp format. Expected HH:MM:SS.mmm")

    start_seconds = parse_timestamp_to_seconds(start_time)
    end_seconds = parse_timestamp_to_seconds(end_time)
    if start_seconds >= end_seconds:
        raise HTTPException(status_code=400, detail="start_time must be before end_time")

    # Cut the new clip
    clip_file_name = f"recut_{clip_id}.mp4"
    clip_output_path = project_dir / "clips" / clip_file_name
    clip_output_path.parent.mkdir(parents=True, exist_ok=True)

    result = cut_clip(
        source_video=str(project_dir / "source.mp4"),
        start_time=start_time,
        end_time=end_time,
        output_path=str(clip_output_path)
    )

    if result is None:
        raise HTTPException(status_code=500, detail="Failed to recut clip")

    # Update clip in project.json
    project_data["clips"][clip_index]["start"] = start_time
    project_data["clips"][clip_index]["end"] = end_time
    project_data["clips"][clip_index]["title"] = clip_title or project_data["clips"][clip_index]["title"]
    project_data["clips"][clip_index]["clip_file"] = clip_file_name
    project_data["clips"][clip_index]["status"] = "cut"
    project_data["clips"][clip_index]["final_file"] = None

    with open(project_json_path, "w") as f:
        json.dump(project_data, f, indent=2)

    return JSONResponse(content={
        "status": "success",
        "message": "Clip recut successfully",
        "clip_id": clip_id,
        "clip_file": clip_file_name
    })


@app.post("/projects/{project_id}/clip/{clip_id}/restitch")
async def restitch_clip(
    project_id: str,
    clip_id: str,
    logo_override: str = Form(default=None)
):
    """Restitch a single completed clip with branding.

    Args:
        project_id: UUID of the project
        clip_id: ID of the clip to restitch
        logo_override: Optional logo file path

    Returns:
        JSON response with restitch status
    """
    project_dir = BASE_DIR / project_id
    if not project_dir.exists():
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    project_json_path = project_dir / "project.json"
    if not project_json_path.exists():
        raise HTTPException(status_code=404, detail="project.json not found")

    with open(project_json_path, "r") as f:
        project_data = json.load(f)

    # Find the clip
    clip_index = None
    for i, clip in enumerate(project_data["clips"]):
        if clip.get("id") == clip_id:
            clip_index = i
            break

    if clip_index is None:
        raise HTTPException(status_code=404, detail=f"Clip {clip_id} not found")

    clip = project_data["clips"][clip_index]
    if clip.get("status") != "cut":
        raise HTTPException(status_code=400, detail=f"Clip {clip_id} is not cut yet")

    # Get branding
    branding = project_data.get("branding", {})
    channel_name = branding.get("channel", "CocktailClips")
    outro_text = branding.get("outro_text", "Follow for Part 2")
    hook = clip.get("hook", "")
    next_hook = clip.get("next_hook", "")

    # Determine logo path
    logo_path = None
    assets_dir = Path("assets")
    for lp in [assets_dir / "logo.png", assets_dir / "logo.jpg", project_dir / "logo.png"]:
        if lp.exists():
            logo_path = str(lp)
            break
    if logo_override and os.path.exists(logo_override):
        logo_path = logo_override

    # Create intro with hook text
    intro_output = project_dir / f"intro_{clip_id}.mp4"
    try:
        ffmpeg.input('color=c=black:d=2', f='lavfi').output(
            str(intro_output),
            vf=f"drawtext=text='{hook}':fontsize=24:fontcolor=white:x=(w-text_width/2):y=(h-text_height-10)",
            codec="libx264"
        ).overwrite_output().run(capture_stdout=True, capture_stderr=True)
    except Exception:
        intro_output = None

    # Create outro with next_hook text
    outro_output = project_dir / f"outro_{clip_id}.mp4"
    try:
        ffmpeg.input('color=c=black:d=2', f='lavfi').output(
            str(outro_output),
            vf=f"drawtext=text='{next_hook}':fontsize=24:fontcolor=white:x=(w-text_width/2):y=(h-text_height-10)",
            codec="libx264"
        ).overwrite_output().run(capture_stdout=True, capture_stderr=True)
    except Exception:
        outro_output = None

    # Prepare clip paths
    clip_file = clip.get("clip_file")
    clip_path = str(project_dir / "clips" / clip_file) if clip_file and (project_dir / "clips" / clip_file).exists() else None

    if clip_path and intro_output and outro_output:
        output_filename = f"final_{clip_id}.mp4"
        output_path = str(project_dir / "final" / output_filename)

        result = stitch_video(
            clips=[clip_path],
            intro_path=str(intro_output),
            outro_path=str(outro_output),
            output_path=output_path,
            logo_path=logo_path,
            logo_size="150x150"
        )

        if result is None:
            raise HTTPException(status_code=500, detail="Failed to restitch clip")
    elif clip_path:
        output_filename = f"final_{clip_id}.mp4"
        output_path = str(project_dir / "final" / output_filename)
        import shutil
        shutil.copy2(clip_path, output_path)
        result = output_path
    else:
        raise HTTPException(status_code=400, detail="Clip file not found")

    # Update clip
    final_file_name = os.path.basename(output_path)
    project_data["clips"][clip_index]["final_file"] = final_file_name
    project_data["clips"][clip_index]["status"] = "completed"

    with open(project_json_path, "w") as f:
        json.dump(project_data, f, indent=2)

    return JSONResponse(content={
        "status": "success",
        "message": "Clip restitched successfully",
        "final_file": final_file_name,
        "clip_id": clip_id
    })


@app.get("/projects/{project_id}/source")
async def preview_source(project_id: str):
    """Stream the project's original source video."""
    source_path = BASE_DIR / project_id / "source.mp4"
    if not source_path.exists():
        raise HTTPException(status_code=404, detail="Source video not found")
    return FileResponse(str(source_path), media_type="video/mp4", filename="source.mp4")


@app.get("/projects/{project_id}/clips/{clip_id}/preview")
async def preview_clip(
    project_id: str,
    clip_id: str
):
    """Get a preview video file for a clip.

    Args:
        project_id: UUID of the project
        clip_id: ID of the clip

    Returns:
        Video file response
    """
    project_dir = BASE_DIR / project_id
    if not project_dir.exists():
        raise HTTPException(status_code=404, detail="Project not found")

    with open(project_dir / "project.json", "r") as f:
        project_data = json.load(f)

    clip = None
    for c in project_data["clips"]:
        if c.get("id") == clip_id:
            clip = c
            break

    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    clip_file = clip.get("clip_file") or clip.get("final_file")
    if not clip_file:
        raise HTTPException(status_code=404, detail="No preview file available")

    video_path = project_dir / "clips" / clip_file
    if not video_path.exists():
        video_path = project_dir / "final" / clip_file
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Preview file not found")

    return FileResponse(
        str(video_path),
        media_type="video/mp4",
        filename=clip_file
    )


@app.get("/projects/{project_id}/download")
async def download_final_video(
    project_id: str
):
    """Download the final stitched video for a project.

    Args:
        project_id: UUID of the project

    Returns:
        Video file response
    """
    project_dir = BASE_DIR / project_id
    if not project_dir.exists():
        raise HTTPException(status_code=404, detail="Project not found")

    with open(project_dir / "project.json", "r") as f:
        project_data = json.load(f)

    output_file = project_data.get("output", {}).get("file")
    if output_file:
        video_path = project_dir / output_file
        final_file = video_path.name
    else:
        final_file = next((clip.get("final_file") for clip in project_data["clips"] if clip.get("final_file")), None)
        if not final_file:
            raise HTTPException(status_code=404, detail="No final video available")
        video_path = project_dir / "final" / final_file

    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Final video file not found")

    return FileResponse(
        str(video_path),
        media_type="video/mp4",
        filename=final_file
    )


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,

    )


@app.post("/imports/metadata")
async def import_metadata(payload: dict = Body(...)):
    """Inspect a supported URL without downloading its media."""
    try:
        return fetch_metadata(str(payload.get("url") or ""))
    except Exception as error:
        detail = str(error) if isinstance(error, MediaImportError) else f"Could not inspect this source: {error}"
        raise HTTPException(status_code=400, detail=detail) from error


def _run_url_import(job_id: str, project_id: str, project_name: str, url: str, quality: str, subtitles: bool) -> None:
    project_dir = BASE_DIR / project_id
    try:
        def update(values: dict) -> None:
            IMPORT_JOBS[job_id].update(values)
        metadata = download_media(url, project_dir, quality, subtitles, update)
        project_data = _new_project_data(project_id, project_name, {
            "type": "url", "video": "source.mp4", "subtitle": metadata.pop("subtitle"), **metadata,
        })
        (project_dir / "project.json").write_text(json.dumps(project_data, indent=2), encoding="utf-8")
        IMPORT_JOBS[job_id].update({"stage": "ready", "progress": 100, "status": "completed", "project_id": project_id})
    except Exception as error:
        IMPORT_JOBS[job_id].update({"stage": "failed", "status": "failed", "error": str(error)})


@app.post("/imports/start", status_code=202)
async def start_url_import(background_tasks: BackgroundTasks, payload: dict = Body(...)):
    """Start a background URL import and return a polling job ID."""
    url = str(payload.get("url") or "")
    project_name = str(payload.get("project_name") or "Imported media").strip()[:120]
    quality = str(payload.get("quality") or "1080p")
    project_id, job_id = str(uuid.uuid4()), str(uuid.uuid4())
    IMPORT_JOBS[job_id] = {
        "id": job_id, "status": "processing", "stage": "preparing", "progress": 0,
        "project_id": project_id, "created_at": datetime.now(timezone.utc).isoformat(),
    }
    background_tasks.add_task(_run_url_import, job_id, project_id, project_name, url, quality, bool(payload.get("import_subtitles", True)))
    return IMPORT_JOBS[job_id]


@app.get("/imports/{job_id}")
async def get_import_job(job_id: str):
    job = IMPORT_JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")
    return job


@app.get("/projects/{project_id}/transcript/download")
async def download_project_transcript(project_id: str):
    transcript_path = BASE_DIR / project_id / "source.srt"
    if not transcript_path.exists():
        raise HTTPException(status_code=404, detail="This project does not have an imported transcript")
    return FileResponse(transcript_path, media_type="application/x-subrip", filename="source.srt")
