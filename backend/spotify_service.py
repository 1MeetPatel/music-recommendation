import os
import requests
import logging

logger = logging.getLogger(__name__)

# Map moods to search keywords as requested
MOOD_MAP = {
    "happy":    "happy english songs",
    "sad":      "sad english songs",
    "relaxed":  "chill english songs",
    "energetic":"workout english songs",
    "romantic": "romantic english songs",
    "angry":    "rock english songs",
    "focus":    "instrumental english songs"
}

class SpotifyService:
    def __init__(self):
        # Uses iTunes Search API (free, no auth required)
        self.api_base_url = "https://itunes.apple.com/search"

    def recommend_songs(self, mood, limit=15):
        """Return songs matching mood keyword. Now fetches a larger pool for ML re-ranking."""
        keyword = MOOD_MAP.get(mood.lower())
        if not keyword:
            return {"error": f"Invalid mood. Supported moods: {', '.join(MOOD_MAP.keys())}", "songs": []}
        return self.search_songs(keyword, limit)

    def search_songs(self, query, limit=15):
        """
        Search iTunes for songs matching the query.
        Fetches up to 100 results (for ML ranking pool) and filters to those with a preview URL.
        Each song dict now includes:
          - id, title, artist, image, preview_url
          - genre        (primaryGenreName from iTunes)
          - duration_ms  (trackTimeMillis from iTunes)
        """
        # Fetch a larger pool so the ML re-ranker has more candidates to choose from
        fetch_limit = max(limit * 4, 100)

        params = {
            "term":   query,
            "entity": "song",
            "limit":  min(fetch_limit, 200),   # iTunes hard cap is 200
        }

        try:
            res = requests.get(self.api_base_url, params=params, timeout=10)
            res.raise_for_status()
            data = res.json()

            tracks = data.get("results", [])

            valid_songs = []
            for track in tracks:
                preview_url = track.get("previewUrl")
                if not preview_url:
                    continue

                image_url = track.get("artworkUrl100")
                if image_url:
                    image_url = image_url.replace("100x100bb", "600x600bb")

                valid_songs.append({
                    "id":          str(track.get("trackId")),
                    "title":       track.get("trackName",        "Unknown"),
                    "artist":      track.get("artistName",       "Unknown"),
                    "image":       image_url,
                    "preview_url": preview_url,
                    # --- NEW: ML feature fields ---
                    "genre":       track.get("primaryGenreName", "Unknown"),
                    "duration_ms": track.get("trackTimeMillis",  0),
                })

                if len(valid_songs) >= fetch_limit:
                    break

            return {"songs": valid_songs}

        except Exception as e:
            logger.error(f"Failed to fetch songs from iTunes: {e}")
            return {"error": "Failed to fetch from Music API", "songs": []}
