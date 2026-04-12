import sys
import os
import json
from dotenv import load_dotenv
from spotify_service import SpotifyService, MOOD_MAP
import traceback

load_dotenv()

service = SpotifyService()
svc_token = service.get_access_token()
print("Token:", svc_token)

try:
    token = svc_token
    import requests
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "q": "happy english songs",
        "type": "track",
        "market": "US",
        "limit": 5
    }
    res = requests.get("https://api.spotify.com/v1/search", headers=headers, params=params)
    print("Status code:", res.status_code)
    print("Response text length:", len(res.text))
    print("Response text:", res.text[:200])
    
    print(f"Total tracks returned: {len(tracks)}")
    
    for idx, track in enumerate(tracks):
        print(f"Track {idx}: {track.get('name')} | Preview URL: {track.get('preview_url')}")
except Exception as e:
    traceback.print_exc()
