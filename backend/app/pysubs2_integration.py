"""pysubs2 integration for subtitle extraction and burning.

Provides functions to:
- Extract subtitle events from SRT within clip timestamps
- Shift timestamps so subtitles start at 0 in the clip
- Generate temporary ASS subtitle file
- Burn ASS subtitles into video using FFmpeg
- Fallback: regenerate subtitles from transcript timestamps in project.json
"""

import ffmpeg
import os
import tempfile
from typing import Optional, List, Dict, Any

try:
    import pysubs2
    from pysubs2 import SSAFile, Event
    PYSUBS2_AVAILABLE = True
except ImportError:
    PYSUBS2_AVAILABLE = False


def extract_subtitles_srt(
    srt_path: str,
    clip_start: str,
    clip_end: str
) -> Optional[SSAFile]:
    """Extract subtitle events from SRT file within clip timestamps.

    Loads the SRT file, filters events that fall within the clip's
    start/end timestamps, and returns an SSAFile with the extracted events.

    Args:
        srt_path: Path to the source SRT file
        clip_start: Clip start timestamp in HH:MM:SS.mmm format
        clip_end: Clip end timestamp in HH:MM:SS.mmm format

    Returns:
        Optional[SSAFile]: SSAFile with extracted subtitle events, or None if failed

    Raises:
        ImportError: If pysubs2 is not installed
        FileNotFoundError: If SRT file doesn't exist
        ValueError: If timestamps are invalid

    Example:
        >>> ssa_file = extract_subtitles_srt("source.srt", "00:02:13.500", "00:02:42.800")
        >>> len(ssa_file.events)
        5
    """
    if not PYSUBS2_AVAILABLE:
        raise ImportError(
            "pysubs2 is not installed. Install with: pip install pysubs2"
        )

    if not os.path.exists(srt_path):
        raise FileNotFoundError(f"SRT file not found: {srt_path}")

    # Parse timestamps to seconds
    try:
        start_seconds = parse_timestamp_to_seconds_pysubs2(clip_start)
        end_seconds = parse_timestamp_to_seconds_pysubs2(clip_end)
    except ValueError as e:
        raise ValueError(f"Invalid timestamp format: {e}")

    # Load the SRT file using pysubs2
    try:
        subs = pysubs2.load(srt_path, encoding="utf-8")
    except Exception as e:
        raise ValueError(f"Failed to load SRT file: {e}")

    # Filter events that fall within the clip timestamps
    extracted_events = []
    for event in subs.events:
        # Check if event falls within clip timestamps
        # event.start and event.end are in seconds (float)
        if event.start is not None and event.end is not None:
            if start_seconds <= event.start < end_seconds:
                # Also check end time
                if start_seconds < event.end <= end_seconds:
                    extracted_events.append(event)
                # Also include events that span the clip start
                elif event.start < start_seconds < event.end:
                    extracted_events.append(event)

    # Create a new SSAFile with only the extracted events
    if not extracted_events:
        # Return empty SSAFile if no events found
        ssa_file = SSAFile()
        return ssa_file

    ssa_file = SSAFile()
    ssa_file.events = extracted_events

    return ssa_file


def shift_subtitle_timestamps(
    ssa_file: SSAFile,
    clip_start_seconds: float
) -> SSAFile:
    """Shift subtitle timestamps so they start at 0 in the clip.

    Takes an SSAFile with events that start at clip_start_seconds and
    shifts all events so the first event starts at 0.

    Args:
        ssa_file: SSAFile with subtitle events
        clip_start_seconds: The clip's start time in seconds (float)

    Returns:
        SSAFile: New SSAFile with shifted timestamps

    Example:
        >>> shifted = shift_subtitle_timestamps(ssa_file, 133.5)
        >>> shifted.events[0].start  # Should be 0.0
    """
    if not PYSUBS2_AVAILABLE:
        raise ImportError(
            "pysubs2 is not installed. Install with: pip install pysubs2"
        )

    # Calculate shift amount
    shift_amount = clip_start_seconds

    # Create a new SSAFile with shifted timestamps
    shifted_events = []
    for event in ssa_file.events:
        # Shift both start and end timestamps
        shifted_start = event.start - shift_amount if event.start else 0.0
        shifted_end = event.end - shift_amount if event.end else None

        # Create a new event with shifted timestamps
        new_event = Event()
        new_event.start = shifted_start
        new_event.end = shifted_end
        new_event.text = event.text
        new_event.layer = event.layer
        new_event.style = event.style.copy() if event.style else {}
        new_event.metadata = event.metadata

        shifted_events.append(new_event)

    # Create new SSAFile with shifted events
    shifted_ssa = SSAFile()
    shifted_ssa.events = shifted_events

    return shifted_ssa


def generate_ass_file(ssa_file: SSAFile, output_path: str) -> bool:
    """Generate an ASS subtitle file from an SSAFile.

    Args:
        ssa_file: SSAFile with subtitle events
        output_path: Path where the .ass file will be saved

    Returns:
        bool: True if successfully generated, False otherwise

    Raises:
        ImportError: If pysubs2 is not installed
    """
    if not PYSUBS2_AVAILABLE:
        raise ImportError(
            "pysubs2 is not installed. Install with: pip install pysubs2"
        )

    try:
        # Write the SSAFile to ASS format
        # pysubs2 can write ASS/SSA format
        with open(output_path, "w", encoding="utf-8") as f:
            # Write ASS header
            f.write("""[Script Info]
Title: CocktailClips Subtitles
ScriptType: v4.00
WrapStyle: 0
ScaledBorderAndShadow: 1
YCbCr Matrix: 170m

[Events]
""")

            # Write each event
            for event in ssa_file.events:
                # Format: Dialogue: Layer, Start, End, Style, MarginL, MarginR, MarginV, Effect, Text
                start_str = format_ass_timestamp(event.start) if event.start else "00:00:00.00"
                end_str = format_ass_timestamp(event.end) if event.end else "00:00:00.00"

                # Build style string
                style_parts = []
                if event.style:
                    if "Bold" in event.style:
                        style_parts.append("Bold")
                    if "Outline" in event.style:
                        style_parts.append("Outline")
                    if "Shadow" in event.style:
                        style_parts.append("Shadow")
                    if event.style.get("FontName"):
                        style_parts.append(f"Font={event.style['FontName']}")
                    if event.style.get("FontSize"):
                        style_parts.append(f"FontSize={event.style['FontSize']}")
                    if event.style.get("PrimaryColour"):
                        style_parts.append(f"PrimaryColour={event.style['PrimaryColour']}")

                style_str = ",".join(style_parts) if style_parts else ""

                # Escape special characters in text for ASS
                text_ass = escape_ass_text(event.text)

                f.write(
                    f"Dialogue: {event.layer},"
                    f"{start_str},"
                    f"{end_str},"
                    f"{style_str},"
                    f",,"  # Margins (empty for default)
                    f"{{{text_ass}}}\n"
                )

        return True

    except Exception as e:
        print(f"Error generating ASS file: {e}")
        return False


def format_ass_timestamp(seconds: float) -> str:
    """Convert seconds to ASS timestamp format (HH:MM:SS.cc).

    Args:
        seconds: Time in seconds (float)

    Returns:
        str: ASS timestamp format HH:MM:SS.cc

    Example:
        >>> format_ass_timestamp(133.5)
        '00:02:13.50'
    """
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centisecs = round((seconds - int(seconds)) * 100)

    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{centisecs:02d}"


def escape_ass_text(text: str) -> str:
    """Escape special characters for ASS subtitle text.

    ASS has special syntax that needs escaping, particularly curly braces {}.

    Args:
        text: Original subtitle text

    Returns:
        str: Escaped text safe for ASS format
    """
    # Escape curly braces (ASS uses {} for commands)
    escaped = text.replace("{", "\\{").replace("}", "\\}")

    # Escape other ASS special characters
    # Linefeed -> \\N
    escaped = escaped.replace("\n", "\\N")

    return escaped


def burn_subtitles_ffmpeg(
    video_path: str,
    subtitle_ass_path: str,
    output_path: str
) -> Optional[str]:
    """Burn subtitles into video using FFmpeg.

    Uses FFmpeg to overlay ASS subtitles onto the video file.
    The subtitles are burned in permanently (not as a separate track).

    Args:
        video_path: Path to the video file (MP4)
        subtitle_ass_path: Path to the ASS subtitle file
        output_path: Path where the output video will be saved

    Returns:
        Optional[str]: output_path if successful, None if failed

    Raises:
        FileNotFoundError: If video file or subtitle file doesn't exist

    Example:
        >>> result = burn_subtitles_ffmpeg("clips/001.mp4", "subtitles.ass", "final/001.mp4")
        >>> result
        'final/001.mp4'
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    if not os.path.exists(subtitle_ass_path):
        raise FileNotFoundError(f"Subtitle ASS file not found: {subtitle_ass_path}")

    # Ensure output directory exists
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        try:
            os.makedirs(output_dir, exist_ok=True)
        except OSError as e:
            print(f"Cannot create output directory {output_dir}: {e}")
            return None

    try:
        (
            ffmpeg.input(video_path)
            .output(output_path, vf=f"subtitles={subtitle_ass_path}", codec="copy")
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )

        success_msg = f"Successfully burned subtitles: {video_path} -> {output_path}"
        print(success_msg)
        return output_path

    except ffmpeg.Error as e:
        error_msg = f"FFmpeg error burning subtitles: {e.stderr.decode('utf-8', errors='replace') if e.stderr else str(e)}"
        print(error_msg)
        return None
    except Exception as e:
        error_msg = f"Unexpected error burning subtitles: {e}"
        print(error_msg)
        return None


def transcript_to_subtitles_ttml(
    transcript: str,
    start_time: str,
    end_time: str
) -> str:
    """Convert transcript text to TTML subtitle format as fallback.

    If transcript exists in project.json and no SRT subtitles are available,
    this function generates a basic TTML subtitle from the transcript text.

    Args:
        transcript: Transcript text content
        start_time: Clip start timestamp in HH:MM:SS.mmm format
        end_time: Clip end timestamp in HH:MM:SS.mmm format

    Returns:
        str: TTML formatted subtitle content

    Example:
        >>> ttml = transcript_to_subtitles_ttml("Hello world", "00:02:13.500", "00:02:42.800")
        >>> print(ttml[:100])
    """
    # Parse timestamps
    try:
        start_seconds = parse_timestamp_to_seconds_pysubs2(start_time)
        end_seconds = parse_timestamp_to_seconds_pysubs2(end_time)
    except ValueError:
        # Fallback if timestamp parsing fails
        return f"<tt>{transcript}</tt>"

    # Generate basic TTML
    ttml = f"""<?xml version="1.0" encoding="utf-8"?>
<tt xmlns="http://www.w3.org/2006/01/ttml">
  <head>
    <styling>
      <style id="subs" fontFamily="Inter" fontSize="24" color="white" background="black" />
    </styling>
  </head>
  <body>
    <div>
      <p style="subs">
        <span begin="{start_seconds}s" end="{end_seconds}s">
          {transcript}
        </span>
      </p>
    </div>
  </body>
</tt>"""

    return ttml


def parse_timestamp_to_seconds_pysubs2(timestamp: str) -> float:
    """Parse timestamp string (HH:MM:SS.mmm) to seconds for pysubs2 usage.

    Args:
        timestamp: Timestamp in HH:MM:SS.mmm format

    Returns:
        float: Total seconds as a float

    Raises:
        ValueError: If timestamp format is invalid

    Example:
        >>> parse_timestamp_to_seconds_pysubs2("00:02:13.500")
        133.5
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

        total_seconds = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000.0
        return total_seconds

    except (ValueError, IndexError) as e:
        raise ValueError(f"Invalid timestamp format: {timestamp}") from e