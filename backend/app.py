from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import logging
import os
import json

from spotify_service import SpotifyService
from recommendation_engine import ContentBasedRecommender, CollaborativeRecommender
from youtube_service import search_youtube_id

# Configure basic logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

load_dotenv()  # Load variables from .env

# Point Flask to serve the frontend folder (use abspath for gunicorn compatibility)
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
# Enable CORS to allow the frontend to access the API
CORS(app)

@app.route('/')
def serve_frontend():
    return send_from_directory(FRONTEND_DIR, 'index.html')

spotify_service = SpotifyService()
cb_recommender  = ContentBasedRecommender()
cf_recommender  = CollaborativeRecommender()

# ---------------------------------------------------------------------------
# Original endpoints (unchanged behaviour, kept for backward compat)
# ---------------------------------------------------------------------------

@app.route('/api/recommend', methods=['GET'])
def recommend():
    mood  = request.args.get('mood')
    limit = request.args.get('limit', default=15, type=int)
    if not mood:
        return jsonify({"error": "Mood parameter is required"}), 400

    logging.info(f"[recommend] mood={mood}, limit={limit}")
    result = spotify_service.recommend_songs(mood, limit)

    if "error" in result and not result.get("songs"):
        return jsonify(result), 500

    # Trim to requested limit (search_songs now fetches a larger pool)
    songs = result.get("songs", [])[:limit]
    return jsonify({"songs": songs}), 200


@app.route('/api/search', methods=['GET'])
def search():
    query = request.args.get('q')
    limit = request.args.get('limit', default=15, type=int)
    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400

    logging.info(f"[search] q={query}, limit={limit}")
    result = spotify_service.search_songs(query, limit)

    if "error" in result and not result.get("songs"):
        return jsonify(result), 500

    songs = result.get("songs", [])[:limit]
    return jsonify({"songs": songs}), 200


@app.route('/api/trending', methods=['GET'])
def trending():
    limit = request.args.get('limit', default=15, type=int)
    logging.info(f"[trending] limit={limit}")
    result = spotify_service.get_trending_songs(limit)

    if "error" in result and not result.get("songs"):
        return jsonify(result), 500

    songs = result.get("songs", [])[:limit]
    return jsonify({"songs": songs}), 200


# ---------------------------------------------------------------------------
# NEW: Content-Based Smart Recommendation endpoint
# ---------------------------------------------------------------------------

@app.route('/api/smart-recommend', methods=['POST'])
def smart_recommend():
    """
    Re-ranks mood-based candidates using the user's taste profile.

    Request JSON body:
    {
      "mood":      "happy",
      "favorites": [ { "id":"..", "artist":"..", "genre":"..", "duration_ms": 0 }, ... ],
      "history":   [ ... ],
      "limit":     15
    }

    Response:
    {
      "songs":       [...],        # ranked by cosine similarity
      "personalized": true|false   # false when cold-start (no user data)
    }
    """
    data      = request.get_json(force=True, silent=True) or {}
    mood      = data.get("mood")
    favorites = data.get("favorites", [])
    history   = data.get("history",   [])
    limit     = int(data.get("limit", 15))

    if not mood:
        return jsonify({"error": "mood is required"}), 400

    logging.info(f"[smart-recommend] mood={mood}, favs={len(favorites)}, hist={len(history)}, limit={limit}")

    # Fetch a large candidate pool
    result = spotify_service.recommend_songs(mood, limit=80)
    if "error" in result and not result.get("songs"):
        return jsonify(result), 500

    candidates   = result.get("songs", [])
    personalized = bool(favorites or history)

    # Apply content-based re-ranking
    ranked = cb_recommender.rank_songs(candidates, favorites, history)

    return jsonify({
        "songs":       ranked[:limit],
        "personalized": personalized,
    }), 200


# ---------------------------------------------------------------------------
# NEW: Collaborative "Because You Liked" endpoint
# ---------------------------------------------------------------------------

@app.route('/api/because-you-liked', methods=['GET'])
def because_you_liked():
    """
    Returns songs from artists that co-occur with the seed_artist in
    the user's listen history (item-based collaborative filtering).

    Query params:
      artist  – seed artist name   (required)
      genre   – seed genre         (optional, used as fallback)
      history – JSON-encoded list of history song objects
      limit   – number of songs to return (default 15)

    Response:
    {
      "songs":       [...],
      "seed_artist": "Coldplay",
      "reason":      "Because you like Coldplay"
    }
    """
    seed_artist = request.args.get("artist", "").strip()
    genre       = request.args.get("genre",  "").strip()
    limit       = request.args.get("limit", default=15, type=int)

    try:
        history = json.loads(request.args.get("history", "[]"))
    except Exception:
        history = []

    if not seed_artist:
        return jsonify({"error": "artist parameter is required"}), 400

    logging.info(f"[because-you-liked] seed={seed_artist}, genre={genre}, hist={len(history)}, limit={limit}")

    # Find co-occurring artists from history
    similar_artists = cf_recommender.find_similar_artists(seed_artist, history, top_n=3)

    # Fall back: if no co-occurrence data, fetch more by the same artist
    if not similar_artists:
        similar_artists = [seed_artist]

    all_songs = []
    seen_ids  = set()
    reason_label = f"Because you like {seed_artist}"

    for sim_artist in similar_artists:
        res = spotify_service.search_songs(f"{sim_artist} songs", limit=20)
        for song in res.get("songs", []):
            if song["id"] not in seen_ids:
                seen_ids.add(song["id"])
                song["reason"]   = reason_label
                song["ml_badge"] = True
                all_songs.append(song)

    # Genre fallback if we still need more songs
    if genre and len(all_songs) < limit:
        res = spotify_service.search_songs(f"top {genre} hits", limit=20)
        for song in res.get("songs", []):
            if song["id"] not in seen_ids:
                seen_ids.add(song["id"])
                song["reason"]   = f"Matches your {genre} taste"
                song["ml_badge"] = True
                all_songs.append(song)

    return jsonify({
        "songs":       all_songs[:limit],
        "seed_artist": seed_artist,
        "reason":      reason_label,
    }), 200


# ---------------------------------------------------------------------------
# YouTube full-track playback endpoint
# ---------------------------------------------------------------------------

@app.route('/api/youtube-id', methods=['GET'])
def get_youtube_id():
    """
    Searches YouTube for a song and returns its video ID.
    The frontend uses this ID with the YouTube IFrame Player API
    to play full tracks instead of 30-second previews.

    Query params:
      title  – song title (required)
      artist – artist name (optional, improves accuracy)

    Response:
    {
      "video_id": "dQw4w9WgXcQ"
    }
    """
    title  = request.args.get("title", "").strip()
    artist = request.args.get("artist", "").strip()

    if not title:
        return jsonify({"error": "title parameter is required"}), 400

    # Build a search query that's likely to find an embed-friendly version
    query = f"{artist} {title} official music video" if artist else f"{title} official music video"
    logging.info(f"[youtube-id] Searching: {query}")

    video_id = search_youtube_id(query)

    if video_id:
        return jsonify({"video_id": video_id}), 200
    else:
        return jsonify({"error": "Could not find a YouTube video for this song"}), 404


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)
