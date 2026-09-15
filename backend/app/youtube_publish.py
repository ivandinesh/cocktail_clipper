"""Isolated YouTube publishing service using the official Data API client."""

from __future__ import annotations

import json
import os
import re
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

YOUTUBE_UPLOAD_SCOPE = ["https://www.googleapis.com/auth/youtube.upload"]
SECRETS_DIR = Path(os.getenv("COCKTAILCLIPS_SECRETS_DIR", ".secrets"))
CLIENT_SECRET_PATH = SECRETS_DIR / "google_client_secret.json"
TOKEN_PATH = SECRETS_DIR / "youtube_token.json"
REDIRECT_URI = os.getenv("YOUTUBE_REDIRECT_URI", "http://localhost:8000/publishing/youtube/callback")
OAUTH_STATES: set[str] = set()
PUBLISH_JOBS: dict[str, dict] = {}
_lock = threading.Lock()


class YouTubePublishError(RuntimeError):
    pass


def _google_modules():
    try:
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import Flow
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaFileUpload
    except ImportError as error:
        raise YouTubePublishError("Install the backend requirements to enable YouTube publishing") from error
    return Request, Credentials, Flow, build, MediaFileUpload


def save_client_secret(content: bytes) -> None:
    try:
        payload = json.loads(content)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise YouTubePublishError("The selected file is not valid Google OAuth JSON") from error
    config = payload.get("installed") or payload.get("web")
    if not isinstance(config, dict) or not config.get("client_id") or not config.get("client_secret"):
        raise YouTubePublishError("Choose an OAuth client JSON downloaded from Google Cloud")
    SECRETS_DIR.mkdir(parents=True, exist_ok=True)
    CLIENT_SECRET_PATH.write_bytes(content)


def _load_credentials():
    Request, Credentials, _, _, _ = _google_modules()
    if not TOKEN_PATH.exists():
        return None
    credentials = Credentials.from_authorized_user_file(str(TOKEN_PATH), YOUTUBE_UPLOAD_SCOPE)
    if credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())
        TOKEN_PATH.write_text(credentials.to_json(), encoding="utf-8")
    return credentials if credentials.valid else None


def connection_status() -> dict:
    configured = CLIENT_SECRET_PATH.is_file()
    try:
        connected = bool(_load_credentials()) if configured else False
        error = None
    except Exception as reason:
        connected, error = False, str(reason)
    return {"configured": configured, "connected": connected, "error": error}


def begin_oauth() -> str:
    if not CLIENT_SECRET_PATH.exists():
        raise YouTubePublishError("Add your Google OAuth client JSON first")
    _, _, Flow, _, _ = _google_modules()
    flow = Flow.from_client_secrets_file(str(CLIENT_SECRET_PATH), scopes=YOUTUBE_UPLOAD_SCOPE, redirect_uri=REDIRECT_URI)
    authorization_url, state = flow.authorization_url(access_type="offline", prompt="consent", include_granted_scopes="true")
    with _lock:
        OAUTH_STATES.add(state)
    return authorization_url


def finish_oauth(code: str, state: str) -> None:
    with _lock:
        if not state or state not in OAUTH_STATES:
            raise YouTubePublishError("The OAuth request expired or its state did not match")
        OAUTH_STATES.remove(state)
    _, _, Flow, _, _ = _google_modules()
    flow = Flow.from_client_secrets_file(str(CLIENT_SECRET_PATH), scopes=YOUTUBE_UPLOAD_SCOPE, state=state, redirect_uri=REDIRECT_URI)
    flow.fetch_token(code=code)
    SECRETS_DIR.mkdir(parents=True, exist_ok=True)
    TOKEN_PATH.write_text(flow.credentials.to_json(), encoding="utf-8")


def disconnect() -> None:
    TOKEN_PATH.unlink(missing_ok=True)


def new_job(project_id: str, clip_id: str) -> dict:
    job_id = str(uuid.uuid4())
    job = {"id": job_id, "project_id": project_id, "clip_id": clip_id, "status": "queued", "progress": 0, "created_at": datetime.now(timezone.utc).isoformat()}
    with _lock:
        PUBLISH_JOBS[job_id] = job
    return job


def get_job(job_id: str) -> dict | None:
    return PUBLISH_JOBS.get(job_id)


def upload_video(video_path: Path, metadata: dict, update: Callable[[dict], None]) -> dict:
    credentials = _load_credentials()
    if not credentials:
        raise YouTubePublishError("Connect a YouTube account before publishing")
    if not video_path.is_file():
        raise YouTubePublishError("The rendered clip could not be found")
    title = re.sub(r"\s+", " ", str(metadata.get("title") or "Untitled clip")).strip()[:100]
    description = str(metadata.get("description") or "")[:5000]
    privacy = str(metadata.get("privacy") or "private")
    if privacy not in {"private", "unlisted", "public"}:
        raise YouTubePublishError("Privacy must be private, unlisted, or public")
    tags = [str(tag).strip()[:500] for tag in metadata.get("tags", []) if str(tag).strip()][:30]
    made_for_kids = bool(metadata.get("made_for_kids", False))

    _, _, _, build, MediaFileUpload = _google_modules()
    youtube = build("youtube", "v3", credentials=credentials, cache_discovery=False)
    body = {
        "snippet": {"title": title, "description": description, "tags": tags, "categoryId": str(metadata.get("category_id") or "22")},
        "status": {"privacyStatus": privacy, "selfDeclaredMadeForKids": made_for_kids, "containsSyntheticMedia": bool(metadata.get("contains_synthetic_media", False))},
    }
    media = MediaFileUpload(str(video_path), mimetype="video/mp4", chunksize=8 * 1024 * 1024, resumable=True)
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media, notifySubscribers=bool(metadata.get("notify_subscribers", False)))
    response = None
    while response is None:
        status, response = request.next_chunk(num_retries=3)
        if status:
            update({"status": "uploading", "progress": round(status.progress() * 100, 1)})
    video_id = response["id"]
    return {"video_id": video_id, "video_url": f"https://www.youtube.com/watch?v={video_id}", "privacy": privacy, "title": title, "uploaded_at": datetime.now(timezone.utc).isoformat()}
