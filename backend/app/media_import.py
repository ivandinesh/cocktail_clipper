"""Provider-neutral URL media import built on yt-dlp extractors."""

from __future__ import annotations

import shutil
from pathlib import Path
from typing import Callable
from urllib.parse import urlparse


class MediaImportError(RuntimeError):
    pass


def detect_provider(url: str) -> str:
    host = (urlparse(url).hostname or "").lower().removeprefix("www.")
    providers = {
        "youtube.com": "youtube", "youtu.be": "youtube",
        "instagram.com": "instagram", "tiktok.com": "tiktok",
        "twitter.com": "x", "x.com": "x", "facebook.com": "facebook",
        "fb.watch": "facebook", "vimeo.com": "vimeo", "reddit.com": "reddit",
        "redd.it": "reddit",
    }
    return next((name for domain, name in providers.items() if host == domain or host.endswith(f".{domain}")), "web")


def validate_media_url(url: str) -> str:
    parsed = urlparse(url.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise MediaImportError("Enter a valid http or https media URL")
    return url.strip()


def _youtube_dl(options: dict):
    try:
        from yt_dlp import YoutubeDL
    except ImportError as error:
        raise MediaImportError("URL importing requires yt-dlp. Run: pip install -r requirements.txt") from error
    return YoutubeDL(options)


def fetch_metadata(url: str) -> dict:
    url = validate_media_url(url)
    if detect_provider(url) != "youtube":
        raise MediaImportError("Only YouTube links are supported right now")
    with _youtube_dl({"quiet": True, "no_warnings": True, "noplaylist": True}) as downloader:
        info = downloader.extract_info(url, download=False)
    if not info or info.get("_type") == "playlist":
        raise MediaImportError("Playlists are not supported; paste a link to one video")
    heights = sorted({int(item["height"]) for item in info.get("formats", []) if item.get("height")}, reverse=True)
    manual = list((info.get("subtitles") or {}).keys())
    automatic = list((info.get("automatic_captions") or {}).keys())
    return {
        "provider": detect_provider(url),
        "title": info.get("title") or "Untitled media",
        "creator": info.get("channel") or info.get("uploader") or "Unknown creator",
        "duration": info.get("duration"),
        "thumbnail": info.get("thumbnail"),
        "media_id": info.get("id"),
        "qualities": heights[:8],
        "subtitles": {"manual": manual, "automatic": automatic, "available": bool(manual or automatic)},
    }


def _preferred_subtitle(info: dict) -> tuple[str | None, bool]:
    manual = info.get("subtitles") or {}
    automatic = info.get("automatic_captions") or {}
    source_language = info.get("language")
    for collection, is_manual in ((manual, True), (automatic, False)):
        for candidate in (source_language, "en", "en-US", "en-GB"):
            if candidate and candidate in collection:
                return candidate, is_manual
        usable = next((key for key in collection if key != "live_chat" and not key.endswith("-orig")), None)
        if usable:
            return usable, is_manual
    return None, False


def _format_for_quality(quality: str) -> str:
    if quality == "best":
        return "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best"
    try:
        height = max(240, min(2160, int(quality.rstrip("p"))))
    except ValueError:
        height = 1080
    return f"bv*[height<={height}][ext=mp4]+ba[ext=m4a]/b[height<={height}][ext=mp4]/best[height<={height}]"


def download_media(
    url: str,
    project_dir: Path,
    quality: str,
    import_subtitles: bool,
    progress: Callable[[dict], None],
) -> dict:
    url = validate_media_url(url)
    if detect_provider(url) != "youtube":
        raise MediaImportError("Only YouTube links are supported right now")
    project_dir.mkdir(parents=True, exist_ok=True)

    with _youtube_dl({"quiet": True, "no_warnings": True, "noplaylist": True}) as probe:
        info = probe.extract_info(url, download=False)
    subtitle_language, manual_subtitle = _preferred_subtitle(info) if import_subtitles else (None, False)

    def hook(status: dict) -> None:
        if status.get("status") == "downloading":
            total = status.get("total_bytes") or status.get("total_bytes_estimate") or 0
            downloaded = status.get("downloaded_bytes") or 0
            progress({
                "stage": "downloading",
                "progress": round(downloaded * 100 / total, 1) if total else 0,
                "downloaded_bytes": downloaded,
                "total_bytes": total,
                "speed": status.get("speed"),
            })
        elif status.get("status") == "finished":
            progress({"stage": "merging", "progress": 96})

    options = {
        "format": _format_for_quality(quality),
        "outtmpl": str(project_dir / "source.%(ext)s"),
        "merge_output_format": "mp4",
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "progress_hooks": [hook],
        "postprocessors": [{"key": "FFmpegVideoRemuxer", "preferedformat": "mp4"}],
    }
    if subtitle_language:
        options.update({
            "writesubtitles": manual_subtitle,
            "writeautomaticsub": not manual_subtitle,
            "subtitleslangs": [subtitle_language],
            "subtitlesformat": "srt/best",
            "postprocessors": options["postprocessors"] + [{"key": "FFmpegSubtitlesConvertor", "format": "srt"}],
        })

    with _youtube_dl(options) as downloader:
        result = downloader.extract_info(url, download=True)

    video_candidates = [path for path in project_dir.glob("source.*") if path.suffix.lower() in {".mp4", ".mov", ".mkv", ".webm"}]
    if not video_candidates:
        raise MediaImportError("The provider completed without producing a usable video")
    source_path = project_dir / "source.mp4"
    if video_candidates[0] != source_path:
        shutil.move(str(video_candidates[0]), str(source_path))

    subtitle_candidates = sorted(project_dir.glob("source*.srt"))
    subtitle_path = project_dir / "source.srt"
    if subtitle_candidates and subtitle_candidates[0] != subtitle_path:
        shutil.move(str(subtitle_candidates[0]), str(subtitle_path))

    return {
        "provider": detect_provider(url), "url": url, "media_id": result.get("id"),
        "title": result.get("title") or "Untitled media",
        "creator": result.get("channel") or result.get("uploader"),
        "duration": result.get("duration"), "thumbnail": result.get("thumbnail"),
        "subtitle": "source.srt" if subtitle_path.exists() else None,
        "subtitle_language": subtitle_language if subtitle_path.exists() else None,
        "subtitle_kind": ("manual" if manual_subtitle else "automatic") if subtitle_path.exists() else None,
    }
