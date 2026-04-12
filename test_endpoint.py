import urllib.request
import json
try:
    with urllib.request.urlopen("http://localhost:5000/api/recommend?mood=happy") as response:
        print("Status code:", response.getcode())
        data = json.loads(response.read().decode())
        print(f"Total songs: {len(data.get('songs', []))}")
        if data.get('songs'):
            print("First song:", data['songs'][0])
except Exception as e:
    print("Error:", e)
