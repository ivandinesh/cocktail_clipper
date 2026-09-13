"""FFmpeg wrapper for cutting video clips.

Provides the cut_clip() function used by the backend to extract
video segments from the source video based on start/end timestamps.
"""

import ffmpeg
import os
import time
from typing import Optional


def cut_clip(
    source_video: str,
    start_time: str,
    end_time: str,
    output_path: str,
    logger=None,
    progress_callback=None
) -> Optional[str]:
    """Cut a video clip from the source video between start and end timestamps.

    Uses FFmpeg's -ss and -to (or -t) seeking/trimming capabilities.
    -ss before -i seeks faster (accurate keyframe-based seeking)
    -to stops writing at the specified time

    Args:
        source_video: Path to the source video file (e.g., source.mp4)
        start_time: Start timestamp in HH:MM:SS.mmm format (e.g., "00:02:13.500")
        end_time: End timestamp in HH:MM:SS.mmm format (e.g., "00:02:42.800")
        output_path: Path where the clipped video will be saved
        logger: Optional logger instance for output messages
        progress_callback: Optional callback function(progress_percent) for progress updates

    Returns:
        Optional[str]: output_path if successful, None if failed

    Example:
        cut_clip("source.mp4", "00:02:13.500", "00:02:42.800", "clips/001.mp4")
    """
    # Validate input files exist
    if not os.path.exists(source_video):
        error_msg = f"Source video not found: {source_video}"
        if logger:
            logger.error(error_msg)
        print(error_msg)
        return None

    # Validate timestamps
    try:
        start_seconds = parse_timestamp_to_seconds(start_time)
        end_seconds = parse_timestamp_to_seconds(end_time)

        if start_seconds >= end_seconds:
            error_msg = f"Invalid timestamps: start_time ({start_time}) must be before end_time ({end_time})"
            if logger:
                logger.error(error_msg)
            print(error_msg)
            return None

        if end_seconds <= 0:
            error_msg = "End time must be after start time and both must be positive"
            if logger:
                logger.error(error_msg)
            print(error_msg)
            return None

    except ValueError as e:
        error_msg = f"Invalid timestamp format: {e}"
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
        total_duration = end_seconds - start_seconds
        start_ffmpeg = start_time

        # FFmpeg command seeking strategy:
        # -ss before -i: faster seeking, may be slightly inaccurate for non-keyframe positions
        # We use -ss before -i for performance
        try:
            # Use progress monitoring via stderr parsing
            cmd = (
                ffmpeg.input(source_video, ss=start_ffmpeg)
                .output(output_path, ss=start_ffmpeg, to=total_duration, codec="copy")
                .overwrite_output()
            )

            # Run with progress monitoring if callback provided
            if progress_callback:
                # Parse FFmpeg stderr for progress
                def progress_monitor():
                    """Monitor FFmpeg progress from stderr."""
                    try:
                        for line in cmd.run_async(
                            pipe_stderr=True,
                            quiet=False
                        ).stderr:
                            line_str = line.decode("utf-8", errors="replace") if isinstance(line, bytes) else line
                            # FFmpeg may output progress info
                            if "time=" in line_str:
                                try:
                                    # Extract time like "00:01:23.45"
                                    time_str = line_str.split("time=")[1].split()[0]
                                    parts = time_str.split(":")
                                    if len(parts) == 3:
                                        t_seconds = int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
                                        progress = min(100, int((t_seconds / total_duration) * 100))
                                        progress_callback(progress)
                                except (ValueError, IndexError):
                                    pass
                    except Exception:
                        pass

                # Run FFmpeg
                cmd.run_async(pipe_stderr=True, quiet=False)
                result_path = output_path
            else:
                # Run without progress monitoring
                (
                    ffmpeg.input(source_video, ss=start_time)
                    .output(output_path, ss=start_time, to=end_time - start_seconds, codec="copy")
                    .overwrite_output()
                    .run(capture_stdout=True, capture_stderr=True)
                )
                result_path = output_path

            success_msg = f"Successfully cut clip: {start_time} to {end_time} -> {output_path}"
            if logger:
                logger.info(success_msg)
            print(success_msg)

            # Call progress_callback with 100% on completion
            if progress_callback:
                try:
                    progress_callback(100)
                except Exception:
                    pass

            return result_path

        except ffmpeg.Error as e:
            error_msg = f"FFmpeg error cutting clip: {e.stderr.decode('utf-8', errors='replace') if e.stderr else str(e)}"
            if logger:
                logger.error(error_msg)
            print(error_msg)
            return None
        except Exception as e:
            error_msg = f"Unexpected error cutting clip: {e}"
            if logger:
                logger.error(error_msg)
            print(error_msg)
            return None

    except Exception as e:
        error_msg = f"Unexpected error in cut_clip: {e}"
        if logger:
            logger.error(error_msg)
        print(error_msg)
        return None


def parse_timestamp_to_seconds(timestamp: str) -> float:
    """Parse a timestamp string (HH:MM:SS.mmm) to total seconds.

    Args:
        timestamp: Timestamp in HH:MM:SS.mmm format

    Returns:
        float: Total seconds as a float

    Raises:
        ValueError: If timestamp format is invalid

    Examples:
        >>> parse_timestamp_to_seconds("00:02:13.500")
        133.5
        >>> parse_timestamp_to_seconds("01:15:30.000")
        4530.0
    """
    parts = timestamp.strip().split(":")

    if len(parts) != 3:
        raise ValueError(f"Timestamp must have format HH:MM:SS.mmm, got: {timestamp}")

    try:
        hours = int(parts[0])
        minutes = int(parts[1])
        seconds_parts = parts[2].split(".")

        if len(seconds_parts) != 2:
            raise ValueError(f"Timestamp must have milliseconds: {timestamp}")

        seconds = int(seconds_parts[0])
        milliseconds = int(seconds_parts[1])

        # Validate milliseconds range
        if milliseconds < 0 or milliseconds > 999:
            raise ValueError(f"Milliseconds must be between 0 and 999, got: {milliseconds}")

        total_seconds = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000.0
        return total_seconds

    except (ValueError, IndexError) as e:
        raise ValueError(f"Invalid timestamp format: {timestamp}") from e


def validate_timestamp_format(timestamp: str) -> bool:
    """Validate that a timestamp string has the correct HH:MM:SS.mmm format.

    Args:
        timestamp: Timestamp string to validate

    Returns:
        bool: True if valid format, False otherwise
    """
    import re
    pattern = r"^\d{2}:\d{2}:\d{2}\.\d{3}$"
    return bool(re.match(pattern, timestamp))