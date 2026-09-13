"""Video publishing module for YouTube, Instagram, TikTok, Twitter X, and Facebook.

Provides backend endpoints and functions for publishing finished CocktailClips
videos to major social media platforms. Uses OAuth 2.0 for authentication and
platform-specific APIs for upload.

Important: This feature is optional. Core clipping, cutting, and stitching
functions independently. Users can always download final videos and manually
upload to platforms.

Platform Support:
- YouTube: Full API access via Google Data API v3 (recommended, free)
- Instagram: Graph API for Business/Creator accounts (requires approval)
- TikTok: Content Post API (requires partnership/approval)
- Twitter X: API v2 with OAuth 2.0
- Facebook: Graph API (same as Instagram, since Instagram is Meta-owned)
"""

import os
import json
import base64
import time
import hashlib
from typing import Optional, Dict, Any, List
from pathlib import Path

# Platform-specific imports
try:
    import google_auth_oauthlib.flow
    import googleapiclient.discovery
    import googleapiclient.http
    YOUTUBE_AVAILABLE = True
except ImportError:
    YOUTUBE_AVAILABLE = False

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


class PublishingError(Exception):
    """Custom exception for publishing errors."""
    pass


class YouTubePublisher:
    """Handles YouTube video publishing via Google Data API v3."""

    def __init__(self, client_secrets_file: str = "client_secret.json",
                 scopes: List[str] = None):
        self.client_secrets_file = client_secrets_file
        self.scopes = scopes or [
            "https://www.googleapis.com/auth/youtube.upload",
            "https://www.googleapis.com/auth/youtube"
        ]
        self.credentials = None
        self.youtube = None

    def start_oauth_flow(self) -> Dict[str, str]:
        """Start OAuth 2.0 flow for YouTube authentication.

        Returns:
            Dict with authorization URL and state token
        """
        if not os.path.exists(self.client_secrets_file):
            raise PublishingError(
                f"Client secrets file not found: {self.client_secrets_file}. "
                "Download from Google Cloud Console."
            )

        flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(
            self.client_secrets_file, self.scopes
        )
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            prompt='consent'
        )

        return {
            "authorization_url": authorization_url,
            "state": state,
            "platform": "youtube"
        }

    def handle_oauth_callback(self, code: str, state: str) -> bool:
        """Handle OAuth callback and store credentials.

        Args:
            code: Authorization code from callback
            state: State token from initial flow

        Returns:
            True if credentials successfully exchanged and stored
        """
        try:
            flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(
                self.client_secrets_file, self.scopes
            )
            flow.fetch_token(code=code)
            self.credentials = flow.credentials

            # Save credentials for future use
            self._save_credentials()

            # Build YouTube API client
            self.youtube = googleapiclient.discovery.build(
                "youtube", "v3", credentials=self.credentials
            )

            return True
        except Exception as e:
            raise PublishingError(f"OAuth callback failed: {e}")

    def _save_credentials(self) -> None:
        """Save credentials to a token file."""
        token_path = "youtube_token.json"
        credentials_dict = {
            "token": self.credentials.token,
            "refresh_token": self.credentials.refresh_token,
            "token_uri": self.credentials.token_uri,
            "client_id": self.credentials.client_id,
            "client_secret": self.credentials.client_secret,
            "scopes": self.credentials.scopes
        }

        with open(token_path, "w") as f:
            json.dump(credentials_dict, f)

    def upload_video(self, video_path: str, title: str, description: str,
                     tags: List[str] = None, category_id: str = "22",
                     privacy_status: str = "private", short: bool = False) -> Dict[str, Any]:
        """Upload a video to YouTube.

        Args:
            video_path: Path to the MP4 video file
            title: Video title
            description: Video description
            tags: List of tags/tkeywords
            category_id: YouTube category ID (22 = People & Blogs default)
            privacy_status: "public", "private", or "unlisted"
            short: Whether this is a YouTube Short (<= 60 seconds, vertical)

        Returns:
            Dict with video ID, URL, and upload status
        """
        if not self.youtube:
            if not self.credentials:
                raise PublishingError(
                    "YouTube not authenticated. Call start_oauth_flow() and "
                    "handle_oauth_callback() first."
                )
            self.youtube = googleapiclient.discovery.build(
                "youtube", "v3", credentials=self.credentials
            )

        # Prepare the request body
        body = {
            "snippet": {
                "title": title,
                "description": description,
                "tags": tags or [],
                "categoryId": category_id
            },
            "status": {
                "privacyStatus": privacy_status
            }
        }

        # If short video, add appropriate metadata
        if short:
            body["status"]["privacyStatus"] = "public"  # Shorts typically public
            # YouTube Shorts require vertical video and < 60 seconds

        # Create the upload request
        media_body = googleapiclient.http.MediaFileUpload(
            video_path,
            resumable=True,
            chunksize=-1
        )

        # Execute the insert request
        try:
            insert_request = self.youtube.videos().insert(
                part=",".join(body.keys()),
                body=body,
                media_body=media_body
            )

            response = None
            while response is None:
                status, response = insert_request.next_chunk()
                if status:
                    # Log progress
                    print(f"Upload progress: {status.resumable_progress.progress()}%")

            video_id = response.get("id")
            video_url = f"https://www.youtube.com/watch?v={video_id}"

            return {
                "status": "success",
                "video_id": video_id,
                "video_url": video_url,
                "platform": "youtube",
                "privacy_status": privacy_status
            }

        except Exception as e:
            raise PublishingError(f"YouTube upload failed: {e}")

    def set_thumbnail(self, video_id: str, thumbnail_path: str) -> bool:
        """Set custom thumbnail for a YouTube video.

        Args:
            video_id: YouTube video ID
            thumbnail_path: Path to thumbnail image (JPG/BMP/GIF/PNG, < 2MB)

        Returns:
            True if thumbnail successfully set
        """
        if not self.youtube:
            return False

        try:
            # Read thumbnail file
            with open(thumbnail_path, "rb") as f:
                thumbnail_data = f.read()

            # YouTube thumbnail must be < 2MB and specific dimensions
            # Supported: JPG, BMP, GIF, PNG
            # Recommended: 1280x720, 16:9 ratio

            request = self.youtube.videos().setThumbnail(
                videoId=video_id,
                media_body=thumbnail_data
            )

            request.execute()
            return True

        except Exception as e:
            print(f"Could not set thumbnail: {e}")
            return False


class InstagramPublisher:
    """Handles Instagram video publishing via Graph API.

    Note: Instagram publishing requires:
    - Facebook Developer account
    - App reviewed for content publishing
    - Instagram Business or Creator account
    - Long-lived access token
    """

    def __init__(self, access_token: str = None, instagram_account_id: str = None):
        self.access_token = access_token
        self.instagram_account_id = instagram_account_id
        self.graph_url = "https://graph.facebook.com/v20.0"

    def set_credentials(self, access_token: str, instagram_account_id: str) -> None:
        """Set Instagram publishing credentials.

        Args:
            access_long-lived Instagram/Facebook access token
            instagram_account_id: Instagram Business Account ID
        """
        self.access_token = access_token
        self.instagram_account_id = instagram_account_id

    def start_publish(self, video_path: str, caption: str, 
                      thumbnail_path: str = None) -> Dict[str, Any]:
        """Initiate Instagram video publishing.

        Note: Instagram has strict requirements:
        - Feed videos: Up to 60 seconds, 1080x1080 or 1080x1350
        - Stories: Up to 15 seconds, 1080x1920
        - Reels: Up to 90 seconds, 1080x1920

        Args:
            video_path: Path to MP4 video file
            caption: Video caption/description
            thumbnail_path: Optional thumbnail image path

        Returns:
            Dict with publishing status and instructions
        """
        if not self.access_token or not self.instagram_account_id:
            return {
                "status": "error",
                "message": "Instagram credentials not set. Call set_credentials() first.",
                "platform": "instagram"
            }

        # Instagram Graph API requires publishing a video to a IG IGTV or Reels
        # This is a simplified implementation - full implementation requires
        # multi-step process with creation, publishing, and status checking

        file_size = os.path.getsize(video_path)
        video_duration = self._get_video_duration(video_path)

        # Instagram feed video limits
        max_duration = 60  # seconds for feed
        max_file_size = 4 * 1024 * 1024  # 4MB for feed, 100MB for IGTV

        result = {
            "status": "pending",
            "platform": "instagram",
            "message": "Instagram publishing requires multi-step process",
            "video_duration": video_duration,
            "file_size": file_size,
            "instructions": []
        }

        if video_duration and video_duration > max_duration:
            result["instructions"].append(
                f"Video is {video_duration:.1f}s, max feed duration is {max_duration}s. "
                "Consider trimming or using IGTV/Reels."
            )

        if file_size > max_file_size:
            result["instructions"].append(
                f"File is {file_size/1024/1024:.1f}MB, max is {max_file_size/1024/1024:.1f}MB. "
                "Consider compressing the video."
            )

        result["instructions"].append(
            "Full Instagram publishing requires: "
            "1. Create media object via POST /{ig-user-id}/media "
            "2. Publish media via POST /{ig-user-id}/media_publish "
            "3. Check status via GET /{ig-user-id}/media"
        )

        return result

    def _get_video_duration(self, video_path: str) -> Optional[float]:
        """Get video duration using ffprobe."""
        try:
            import subprocess
            result = subprocess.run(
                ["ffprobe", "-v", "quiet", "-print_format", "json",
                 "-show_format", video_path],
                capture_output=True, text=True
            )
            if result.returncode == 0:
                import json
                data = json.loads(result.stdout)
                return float(data.get("format", {}).get("duration", 0))
        except (FileNotFoundError, json.JSONDecodeError, KeyError):
            pass
        return None


class TikTokPublisher:
    """Handles TikTok video publishing.

    Note: TikTok Content Post API requires partnership approval.
    This module provides the structure; full implementation requires
    TikTok developer approval.
    """

    def __init__(self, access_token: str = None, advertiser_id: str = None):
        self.access_token = access_token
        self.advertiser_id = advertiser_id
        self.api_base = "https://open.tiktokapis.com/v2"

    def set_credentials(self, access_token: str, advertiser_id: str = None) -> None:
        """Set TikTok publishing credentials.

        Args:
            access_token: TikTok Content Post API access token
            advertiser_id: Advertiser ID (required for some endpoints)
        """
        self.access_token = access_token
        self.advertiser_id = advertiser_id

    def publish_video(self, video_path: str, title: str, 
                      description: str = "", hashtags: List[str] = None) -> Dict[str, Any]:
        """Publish video to TikTok.

        Note: TikTok Content Post API requires partnership approval.
        This is a skeleton implementation.

        Args:
            video_path: Path to MP4 video file
            title: Video title
            description: Video description
            hashtags: List of hashtags

        Returns:
            Dict with publishing status
        """
        if not self.access_token:
            return {
                "status": "error",
                "message": "TikTok access token not set. "
                "Content Post API requires partnership approval.",
                "platform": "tiktok"
            }

        # TikTok API requires specific format
        # This is a placeholder - full implementation requires partnership
        return {
            "status": "not_implemented",
            "message": "TikTok Content Post API requires partnership approval. "
            "See https://developers.tiktok.com/",
            "platform": "tiktok"
        }


class TwitterPublisher:
    """Handles Twitter X (Twitter) video publishing via API v2."""

    def __init__(self, access_token: str = None, access_token_secret: str = None,
                 consumer_key: str = None, consumer_secret: str = None):
        self.access_token = access_token
        self.access_token_secret = access_token_secret
        self.consumer_key = consumer_key
        self.consumer_secret = consumer_secret
        self.api_base = "https://api.twitter.com/2"

    def set_credentials(self, access_token: str, access_token_secret: str,
                        consumer_key: str, consumer_secret: str) -> None:
        """Set Twitter X credentials.

        Args:
            access_token: OAuth 2.0 access token
            access_token_secret: OAuth 2.0 access token secret
            consumer_key: API Key
            consumer_secret: API Secret Key
        """
        self.access_token = access_token
        self.access_token_secret = access_token_secret
        self.consumer_key = consumer_key
        self.consumer_secret = consumer_secret

    def upload_media(self, video_path: str) -> Dict[str, Any]:
        """Upload media to Twitter X.

        Args:
            video_path: Path to MP4 video file

        Returns:
            Dict with media ID and upload status
        """
        if not all([self.access_token, self.access_token_secret,
                     self.consumer_key, self.consumer_secret]):
            return {
                "status": "error",
                "message": "Twitter X credentials not fully set.",
                "platform": "twitter"
            }

        try:
            import requests

            # Step 1: Initialize media upload
            init_url = f"{self.api_base}/media"
            init_params = {
                "command": "INIT",
                "total_bytes": os.path.getsize(video_path),
                "media_type": "video/mp4"
            }

            init_response = requests.post(
                init_url,
                params=init_params,
                auth=self._get_auth()
            )

            if init_response.status_code != 200:
                return {
                    "status": "error",
                    "message": f"Twitter init failed: {init_response.text}",
                    "platform": "twitter"
                }

            media_id = init_response.json().get("media_id_string")
            if not media_id:
                return {
                    "status": "error",
                    "message": "No media_id returned from Twitter init",
                    "platform": "twitter"
                }

            # Step 2: Append media in chunks
            append_url = f"{self.api_base}/media"
            chunk_size = 5 * 1024 * 1024  # 5MB chunks

            with open(video_path, "rb") as f:
                file_data = f.read()

            offset = 0
            while offset < len(file_data):
                chunk = file_data[offset:offset + chunk_size]
                append_params = {
                    "command": "APPEND",
                    "media_id": media_id,
                    "offset": offset
                }

                append_response = requests.post(
                    append_url,
                    params=append_params,
                    data=chunk,
                    auth=self._get_auth()
                )

                if append_response.status_code != 200:
                    return {
                        "status": "error",
                        "message": f"Twitter append failed: {append_response.text}",
                        "platform": "twitter"
                    }

                offset += len(chunk)

            # Step 3: Finalize media
            finalize_url = f"{self.api_base}/media"
            finalize_params = {
                "command": "FINALIZE",
                "media_id": media_id
            }

            finalize_response = requests.post(
                finalize_url,
                params=finalize_params,
                auth=self._get_auth()
            )

            if finalize_response.status_code != 200:
                return {
                    "status": "error",
                    "message": f"Twitter finalize failed: {finalize_response.text}",
                    "platform": "twitter"
                }

            # Step 4: Return media ID
            return {
                "status": "success",
                "media_id": media_id,
                "platform": "twitter",
                "message": "Media uploaded successfully to Twitter X"
            }

        except ImportError:
            return {
                "status": "error",
                "message": "requests library not installed. Install with: pip install requests",
                "platform": "twitter"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Twitter upload failed: {e}",
                "platform": "twitter"
            }

    def _get_auth(self):
        """Get requests auth object from credentials."""
        import requests_oauthlib
        auth = requests_oauthlib.OAuth1(
            self.consumer_key,
            self.consumer_secret,
            self.access_token,
            self.access_token_secret
        )
        return auth

    def post_tweet(self, text: str, media_id: str = None) -> Dict[str, Any]:
        """Post a tweet with optional media.

        Args:
            text: Tweet text
            media_id: Media ID from previous upload

        Returns:
            Dict with tweet status
        """
        if not all([self.access_token, self.access_token_secret,
                     self.consumer_key, self.consumer_secret]):
            return {
                "status": "error",
                "message": "Twitter X credentials not fully set.",
                "platform": "twitter"
            }

        try:
            import requests

            tweet_url = f"{self.api_base}/tweets"
            tweet_data = {
                "text": text
            }

            if media_id:
                tweet_data["media"] = {"media_id": media_id}

            response = requests.post(
                tweet_url,
                json=tweet_data,
                auth=self._get_auth()
            )

            if response.status_code == 200:
                return {
                    "status": "success",
                    "message": "Tweet posted successfully to Twitter X",
                    "platform": "twitter"
                }
            else:
                return {
                    "status": "error",
                    "message": f"Twitter tweet failed: {response.text}",
                    "platform": "twitter"
                }

        except ImportError:
            return {
                "status": "error",
                "message": "requests library not installed. Install with: pip install requests",
                "platform": "twitter"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Twitter post failed: {e}",
                "platform": "twitter"
            }


class FacebookPublisher:
    """Handles Facebook video publishing via Graph API.

    Note: Facebook publishing is same as Instagram since Instagram is Meta-owned.
    Requires Facebook Developer account and app review for content publishing.
    """

    def __init__(self, access_token: str = None, page_id: str = None):
        self.access_token = access_token
        self.page_id = page_id
        self.graph_url = "https://graph.facebook.com/v20.0"

    def set_credentials(self, access_token: str, page_id: str = None) -> None:
        """Set Facebook publishing credentials.

        Args:
            access_token: Long-lived Facebook access token
            page_id: Facebook Page ID to publish to
        """
        self.access_token = access_token
        self.page_id = page_id or self._get_default_page_id()

    def _get_default_page_id(self) -> str:
        """Get default page ID from access token info."""
        # In full implementation, would decode token to get page ID
        return ""

    def publish_video(self, video_path: str, caption: str = "",
                      thumbnail_path: str = None) -> Dict[str, Any]:
        """Publish video to Facebook.

        Note: Same requirements as Instagram (since both use Facebook Graph API).

        Args:
            video_path: Path to MP4 video file
            caption: Video caption/description
            thumbnail_path: Optional thumbnail image path

        Returns:
            Dict with publishing status
        """
        if not self.access_token or not self.page_id:
            return {
                "status": "error",
                "message": "Facebook credentials not set. "
                "Call set_credentials() first.",
                "platform": "facebook"
            }

        # Facebook Graph API video publishing
        # Similar to Instagram - requires multi-step process
        file_size = os.path.getsize(video_path)
        video_duration = self._get_video_duration(video_path)

        # Facebook video limits
        # Feed: Up to 240 minutes, 8GB max
        # Stories: Up to 20 seconds
        # Reels: Up to 90 seconds

        result = {
            "status": "pending",
            "platform": "facebook",
            "message": "Facebook publishing requires multi-step process",
            "video_duration": video_duration,
            "file_size": file_size,
            "instructions": []
        }

        # Facebook allows longer videos than Instagram
        if video_duration and video_duration > 240 * 60:
            result["instructions"].append(
                f"Video is {video_duration/60:.1f}min, max Facebook feed is 240 minutes. "
                "Consider trimming."
            )

        result["instructions"].append(
            "Full Facebook publishing requires: "
            "1. POST /{page-id}/photos or POST /{page-id}/videos "
            "2. With message caption "
            "3. Check publishing status"
        )

        return result

    def _get_video_duration(self, video_path: str) -> Optional[float]:
        """Get video duration using ffprobe."""
        try:
            import subprocess
            result = subprocess.run(
                ["ffprobe", "-v", "quiet", "-print_format", "json",
                 "-show_format", video_path],
                capture_output=True, text=True
            )
            if result.returncode == 0:
                import json
                data = json.loads(result.stdout)
                return float(data.get("format", {}).get("duration", 0))
        except (FileNotFoundError, json.JSONDecodeError, KeyError):
            pass
        return None


# Factory function to get publisher by platform
def get_publisher(platform: str, **kwargs) -> Optional[object]:
    """Factory function to create platform publisher instance.

    Args:
        platform: Target platform ("youtube", "instagram", "tiktok", "twitter", "facebook")
        **kwargs: Platform-specific credentials

    Returns:
        Publisher instance or None if not supported/available
    """
    if platform == "youtube":
        return YouTubePublisher(**kwargs)
    elif platform == "instagram":
        return InstagramPublisher(**kwargs)
    elif platform == "tiktok":
        return TikTokPublisher(**kwargs)
    elif platform == "twitter":
        return TwitterPublisher(**kwargs)
    elif platform == "facebook":
        return FacebookPublisher(**kwargs)
    else:
        return None