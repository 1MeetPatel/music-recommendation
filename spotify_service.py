import os
import requests
import logging

logger = logging.getLogger(__name__)

# Map moods to search keywords as requested
MOOD_MAP = {
    "happy": "happy english songs",
    "sad": "sad english songs",
    "relaxed": "chill english songs",
    "energetic": "workout english songs",
    "romantic": "romantic english songs",
    "angry": "rock english songs",
    "focus": "instrumental english songs"
}

class SpotifyService:
    def __init__(self):
        # We rename the service logic to use iTunes internally to bypass Spotify's Premium requirement
        self.api_base_url = "https://itunes.apple.com/search"

    def recommend_songs(self, mood):
        # Validate mood and get keyword
        keyword = MOOD_MAP.get(mood.lower())
        if not keyword:
            return {"error": f"Invalid mood. Supported moods: {', '.join(MOOD_MAP.keys())}", "songs": []}

        params = {
            "term": keyword,
            "entity": "song",
            "limit": 25
        }

        try:
            res = requests.get(self.api_base_url, params=params)
            res.raise_for_status()
            data = res.json()
            
            tracks = data.get("results", [])
            
            # Filter tracks with previewUrl
            valid_songs = []
            for track in tracks:
                preview_url = track.get("previewUrl")
                if preview_url:
                    # Apple Music/iTunes API gives artworkUrl100
                    image_url = track.get("artworkUrl100")
                    # Make it a bit bigger by replacing 100x100 with 600x600 in the string
                    if image_url:
                        image_url = image_url.replace("100x100bb", "600x600bb")
                        
                    valid_songs.append({
                        "title": track.get("trackName", "Unknown"),
                        "artist": track.get("artistName", "Unknown"),
                        "image": image_url,
                        "preview_url": preview_url
                    })
                    
                    if len(valid_songs) >= 15:
                        break
                        
            return {"songs": valid_songs}
            
        except Exception as e:
            logger.error(f"Failed to fetch songs from iTunes: {e}")
            return {"error": "Failed to fetch from Music API", "songs": []}

