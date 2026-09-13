"""FFmpeg wrapper for stitching videos with intro, clips, and outro.

Provides the stitch_video() function used by the backend to combine
intro video, multiple clipped video segments, and outro video into
a final branded output video.
"""

import ffmpeg
import os
import time
from typing import Optional, List


def stitch_video(
    clips: List[str],
    intro_path: str,
    outro_path: str,
    output_path: str,
    logo_path: Optional[str] = None,
    logo_size: str = "150x150",
    logger=None,
    progress_callback=None
) -> Optional[str]:
    """Stitch together intro, clips, and outro into a final branded video.

    Uses FFmpeg to concatenate video segments in the following order:
    1. Intro video (e.g., 2-second intro card with hook text)
    2. Clipped video segments (in the order they were cut)
    3. Outro video (e.g., 2-second outro card with next_hook text)

    Optionally overlays a channel logo on the final video.

    Args:
        clips: List of file paths to clipped video segments (e.g., ["clips/001.mp4", "clips/002.mp4"])
        intro_path: File path to the intro video file
        outro_path: File path to the outro video file
        output_path: File path where the final stitched video will be saved
        logo_path: Optional file path to a logo image (PNG recommended)
        logo_size: Size of the logo overlay (e.g., "150x150", "200x200")
        logger: Optional logger instance for output messages
        progress_callback: Optional callback function(progress_percent) for progress updates

    Returns:
        Optional[str]: output_path if successful, None if failed

    Example:
        stitch_video(
            clips=["clips/001.mp4", "clips/002.mp4"],
            intro_path="intro.mp4",
            outro_path="outro.mp4",
            output_path="final/001_final.mp4",
            logo_path="assets/logo.png"
        )
    """
    # Validate input files exist
    all_files = [intro_path, outro_path] + clips
    missing_files = []

    for f in all_files:
        if not os.path.exists(f):
            missing_files.append(f)

    if missing_files:
        error_msg = f"Missing input files: {', '.join(missing_files)}"
        if logger:
            logger.error(error_msg)
        print(error_msg)
        return None

    # Ensure output directory exists
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        try:
            os.makedirs(output_dir, exist_ok=True)
        except OSError as e:
            error_msg = f"Cannot create output directory {output_dir}: {e}"
            if logger:
                logger.error(error_msg)
            print(error_msg)
            return None

    try:
        # Total steps for progress tracking
        # Step 1: Validate all files (0%)
        # Step 2: Build filter complex (10%)
        # Step 3: Concatenate intro + clips (30-70%)
        # Step 4: Add logo if provided (80-90%)
        # Step 5: Final output (100%)

        total_steps = 5
        current_step = 0

        def update_progress(step: int, message: str = "") -> None:
            nonlocal current_step
            current_step = step
            if progress_callback:
                try:
                    progress = min(100, int((step / total_steps) * 100))
                    progress_callback(progress, message)
                except Exception:
                    pass

        update_progress(1, "Validating input files...")

        # Step 2: Build filter complex
        update_progress(2, "Building FFmpeg filter complex...")

        # Get video durations for progress estimation
        def get_video_duration(video_path: str) -> Optional[float]:
            """Get the duration of a video file in seconds."""
            try:
                probe = (
                    ffmpeg.probe(video_path)
                    .streams[0]
                )
                duration_str = probe.duration
                if duration_str:
                    return float(duration_str)
            except Exception:
                pass
            return None

        intro_duration = get_video_duration(intro_path)
        outro_duration = get_video_duration(outro_path)
        clip_durations = []
        for clip_path in clips:
            dur = get_video_duration(clip_path)
            if dur:
                clip_durations.append(dur)

        total_clips_duration = sum(clip_durations) if clip_durations else 0
        total_video_duration = (intro_duration or 0) + total_clips_duration + (outro_duration or 0)

        update_progress(3, "Concatenating video segments...")

        # Build the FFmpeg filter complex for concatenation
        # We'll use the filter_complex approach with concat

        # First, select video and audio streams from each input
        video_streams = []
        audio_streams = []

        # Intro video stream
        intro_video = ffmpeg.input(intro_path).video
        intro_audio = ffmpeg.input(intro_path).audio
        video_streams.append(intro_video)
        audio_streams.append(intro_audio)

        # Clip video and audio streams
        for i, clip_path in enumerate(clips):
            clip_input = ffmpeg.input(clip_path)
            clip_video = clip_input.video
            clip_audio = clip_input.audio
            video_streams.append(clip_video)
            audio_streams.append(clip_audio)

        # Outro video stream
        outro_video = ffmpeg.input(outro_path).video
        outro_audio = ffmpeg.input(outro_path).audio
        video_streams.append(outro_video)
        audio_streams.append(outro_audio)

        num_inputs = len(video_streams)  # intro + clips + outro

        # Build the filter complex string
        # Format: [0:v:0][0:a:0][1:v:0][1:a:0]concat=n:v:a[v][a]
        filter_parts = []

        for i in range(num_inputs):
            filter_parts.append(f"[{i}:v]:v")
            filter_parts.append(f"[{i}:a]:a")

        filter_string = "".join(filter_parts)
        filter_string += f"concat={num_inputs}:v:a[out_v][out_a]"

        update_progress(4, "Finalizing output video...")

        # Create the output with the filter complex
        try:
            result = (
                ffmpeg.input(intro_path)
                .output(
                    output_path,
                    vf="[out_v]",
                    ac="[out_a]"
                )
                .filter_complex(filter_string)
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )

            # If logo overlay is requested and provided
            if logo_path and os.path.exists(logo_path):
                # Re-run with logo overlay
                logo_update_progress = 95
                if progress_callback:
                    try:
                        progress_callback(logo_update_progress, "Applying logo overlay...")
                    except Exception:
                        pass

                logo_result = (
                    ffmpeg.input(output_path)
                    .output(
                        output_path,
                        vf=f'overlay={logo_path}:x=main_w-{int(float(logo_size.split("x")[0]))}:y=main_h-{int(float(logo_size.split("x")[1]))}',
                        codec="copy"
                    )
                    .overwrite_output()
                    .run(capture_stdout=True, capture_stderr=True)
                )

                logo_message = "Logo overlay applied successfully"
                if progress_callback:
                    try:
                        progress_callback(100, logo_message)
                    except Exception:
                        pass
                else:
                    progress_callback(100, logo_message)
            else:
                if progress_callback:
                    try:
                        progress_callback(100, "Stitching completed successfully")
                    except Exception:
                        pass

            success_msg = f"Successfully stitched video: {len(clips)} clips + intro + outro -> {output_path}"
            if logger:
                logger.info(success_msg)
            print(success_msg)

            return output_path

        except ffmpeg.Error as e:
            error_msg = f"FFmpeg error stitching video: {e.stderr.decode('utf-8', errors='replace') if e.stderr else str(e)}"
            if logger:
                logger.error(error_msg)
            print(error_msg)
            if progress_callback:
                try:
                    progress_callback(0, "FFmpeg error occurred")
                except Exception:
                    pass
            return None
        except Exception as e:
            error_msg = f"Unexpected error stitching video: {e}"
            if logger:
                logger.error(error_msg)
            print(error_msg)
            if progress_callback:
                try:
                    progress_callback(0, "Unexpected error occurred")
                except Exception:
                    pass
            return None

    except Exception as e:
        error_msg = f"Unexpected error in stitch_video: {e}"
        if logger:
            logger.error(error_msg)
        print(error_msg)
        if progress_callback:
            try:
                progress_callback(0, "Unexpected error in stitch_video")
            except Exception:
                pass
        return None


def get_video_duration(video_path: str) -> Optional[float]:
    """Get the duration of a video file in seconds.

    Uses FFmpeg probe to get the exact duration.

    Args:
        video_path: Path to the video file

    Returns:
        float: Duration in seconds, or None if cannot determine
    """
    try:
        probe = (
            ffmpeg.probe(video_path)
            .streams[0]
        )
        duration_str = probe.duration
        if duration_str:
            return float(duration_str)
    except Exception as e:
        print(f"Could not get duration for {video_path}: {e}")
    return None


def validate_video_file(video_path: str) -> bool:
    """Validate that a file is a valid video file.

    Args:
        video_path: Path to the file to validate

    Returns:
        bool: True if valid video file, False otherwise
    """
    if not os.path.exists(video_path):
        return False

    valid_extensions = [".mp4", ".mov", ".avi", ".mkv", ".webm"]
    _, ext = os.path.splitext(video_path)
    return ext.lower() in valid_extensions