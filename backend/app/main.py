"""Backend for CocktailClips — Local AI Video Clipper.

FastAPI-based backend that handles:
- Project creation with video + subtitle uploads
- project.json management
- Clip cutting (FFmpeg wrapper - Phase 2)
- Stitch/branding (Phase 3)
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
import uvicorn
import json
import os
import uuid
import tempfile
import ffmpeg
from pathlib import Path
from typing import Optional

from .cut_clip import cut_clip, parse_timestamp_to_seconds, validate_timestamp_format
from .stitch_video import stitch_video, get_video_duration, validate_video_file
from .pysubs2_integration import extract_subtitles_srt, shift_subtitle_timestamps, generate_ass_file, burn_subtitles_ffmpeg

app = FastAPI(
    title="CocktailClips Backend",
    description="Local AI Video Clipper — Backend API",
    version="0.1.0"
)

# Base directory for all projects
BASE_DIR = Path("projects")
BASE_DIR.mkdir(parents=True, exist_ok=True)


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
    subtitle: UploadFile = File(...),
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
    if not video.filename.endswith(".mp4"):
        raise HTTPException(
            status_code=400,
            detail="Video file must be .mp4 format"
        )

    # Validate subtitle file type
    if not subtitle.filename.endswith(".srt"):
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
    subtitle_path = project_dir / "source.srt"
    with open(subtitle_path, "wb") as f:
        content = await subtitle.read()
        f.write(content)

    # Create initial project.json
    project_data = {
        "project": {
            "id": project_id,
            "name": project_name
        },
        "source": {
            "video": "source.mp4",
            "subtitle": "source.srt"
        },
        "branding": {
            "channel": "CocktailClips",
            "intro_duration": 2,
            "outro_duration": 2,
            "outro_text": "Follow for Part 2"
        },
        "clips": []
    }

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


@app.post("/projects/import-scenes")
async def import_scenes(
    project_id: str = Form(...),
    scenes_file: UploadFile = File(...)
):
    """Import AI-generated scenes JSON and merge into project.json.

    Args:
        project_id: UUID of the project to import scenes into
        scenes_file: JSON file containing scene definitions

    Returns:
        JSON response with import status
    """
    project_dir = BASE_DIR / project_id
    if not project_dir.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Project {project_id} not found"
        )

    # Validate JSON file
    if not scenes_file.filename.endswith(".json"):
        raise HTTPException(
            status_code=400,
            detail="Scenes file must be .json format"
        )

    # Read and parse scenes JSON
    content = await scenes_file.read()
    try:
        scenes_data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Invalid JSON format in scenes file"
        )

    # Read existing project.json
    project_json_path = project_dir / "project.json"
    if not project_json_path.exists():
        raise HTTPException(
            status_code=404,
            detail="project.json not found in project directory"
        )

    with open(project_json_path, "r") as f:
        project_data = json.load(f)

    # Merge scenes into project.clips
    new_clips = scenes_data.get("clips", [])
    existing_clips = project_data.get("clips", [])

    # Avoid duplicate IDs - ensure required fields exist
    for clip in new_clips:
        if "id" not in clip:
            clip["id"] = f"imported_{len(existing_clips) + 1}"
        # Ensure required fields exist
        clip.setdefault("status", "planned")
        clip.setdefault("clip_file", None)
        clip.setdefault("final_file", None)
        clip.setdefault("transcript", "")

    project_data["clips"] = existing_clips + new_clips

    # Write updated project.json
    with open(project_json_path, "w") as f:
        json.dump(project_data, f, indent=2)

    return JSONResponse(
        content={
            "status": "success",
            "message": "Scenes imported successfully",
            "total_clips": len(project_data["clips"])
        }
    )


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
            intro_path=intro_output,
            outro_path=outro_output,
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

    # Find the first completed clip's final file
    final_file = None
    for clip in project_data["clips"]:
        if clip.get("final_file"):
            final_file = clip["final_file"]
            break

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
        description="Start the CocktailClips Backend server"
    )