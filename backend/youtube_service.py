"""
YouTube audio service – searches YouTube for a song and returns a video ID
that can be played via the YouTube IFrame Player API on the frontend.

Uses yt-dlp's built-in YouTube search (ytsearch:) so **no API key** is needed.
"""

import logging
import subprocess
import json
import re

logger = logging.getLogger(__name__)

# In-memory cache so repeated lookups for the same song are instant
_cache: dict[str, str] = {}


def search_youtube_id(query: str) -> str | None:
    """
    Search YouTube for *query* and return the first video ID, or None.
    Uses yt-dlp CLI under the hood for maximum reliability.
    """
    cache_key = query.strip().lower()
    if cache_key in _cache:
        return _cache[cache_key]

    try:
        # Use yt-dlp to search YouTube and get the video ID
        result = subprocess.run(
            [
                "yt-dlp",
                "--default-search", "ytsearch1",
                "--no-download",
                "--print", "id",
                "--no-playlist",
                "--quiet",
                f"ytsearch1:{query}",
            ],
            capture_output=True,
            text=True,
            timeout=60,
        )

        video_id = result.stdout.strip()

        if video_id and re.match(r'^[a-zA-Z0-9_-]{11}$', video_id):
            _cache[cache_key] = video_id
            logger.info(f"[youtube] Found video ID '{video_id}' for query '{query}'")
            return video_id

        logger.warning(f"[youtube] No valid video ID for query '{query}'. stdout='{result.stdout.strip()}', stderr='{result.stderr.strip()[:200]}'")
        return None

    except subprocess.TimeoutExpired:
        logger.error(f"[youtube] Timeout searching for '{query}'")
        return None
    except FileNotFoundError:
        logger.error("[youtube] yt-dlp not found. Install with: pip install yt-dlp")
        return None
    except Exception as e:
        logger.error(f"[youtube] Error searching for '{query}': {e}")
        return None
