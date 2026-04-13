import math
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Feature extraction helpers
# ---------------------------------------------------------------------------

def _duration_bucket(duration_ms):
    """Bucket song duration into short / medium / long."""
    if not duration_ms:
        return "medium"
    secs = duration_ms / 1000
    if secs < 180:
        return "short"
    elif secs < 270:
        return "medium"
    return "long"


def build_user_profile(favorites, history):
    """
    Build a weighted sparse feature vector from the user's listening data.

    Weights:
      - Favorites  → ×3  (explicit preference signal)
      - History    → ×1  (implicit play signal)

    Features used:
      - genre:    primaryGenreName from iTunes
      - artist:   artistName (normalised to lowercase)
      - duration: short / medium / long bucket
    """
    profile = {}

    def _add(key, weight):
        profile[key] = profile.get(key, 0) + weight

    for song in favorites:
        genre  = (song.get("genre")  or "Unknown").strip()
        artist = (song.get("artist") or "Unknown").strip().lower()
        dur    = _duration_bucket(song.get("duration_ms"))
        _add(f"genre:{genre}",    3)
        _add(f"artist:{artist}",  3)
        _add(f"dur:{dur}",        1)

    for song in history:
        genre  = (song.get("genre")  or "Unknown").strip()
        artist = (song.get("artist") or "Unknown").strip().lower()
        dur    = _duration_bucket(song.get("duration_ms"))
        _add(f"genre:{genre}",    1)
        _add(f"artist:{artist}",  1)
        _add(f"dur:{dur}",        0.5)

    return profile


def build_song_vector(song):
    """Build a sparse feature vector for a single song."""
    vector = {}
    genre  = (song.get("genre")  or "Unknown").strip()
    artist = (song.get("artist") or "Unknown").strip().lower()
    dur    = _duration_bucket(song.get("duration_ms"))
    vector[f"genre:{genre}"]   = 1.0
    vector[f"artist:{artist}"] = 1.0
    vector[f"dur:{dur}"]       = 0.5
    return vector


def cosine_similarity(vec_a, vec_b):
    """Cosine similarity between two sparse dicts (pure Python, no deps)."""
    if not vec_a or not vec_b:
        return 0.0
    dot   = sum(vec_a.get(k, 0) * v for k, v in vec_b.items())
    mag_a = math.sqrt(sum(v * v for v in vec_a.values()))
    mag_b = math.sqrt(sum(v * v for v in vec_b.values()))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


# ---------------------------------------------------------------------------
# Content-Based Recommender
# ---------------------------------------------------------------------------

class ContentBasedRecommender:
    """
    Re-ranks a pool of candidate songs using cosine similarity against
    a user profile built from their favorites and history.
    """

    def rank_songs(self, songs, favorites, history):
        """
        Parameters
        ----------
        songs     : list[dict]  – candidate songs with genre/artist/duration_ms
        favorites : list[dict]  – user's favorited songs
        history   : list[dict]  – user's listening history (most recent first)

        Returns
        -------
        list[dict] sorted by ml_score descending, each song gains:
          - ml_score : float  cosine similarity to user profile
          - reason   : str | None  human-readable explanation
          - ml_badge : bool  whether to show the "✨ Picked For You" badge
        """
        if not favorites and not history:
            # Cold-start: return as-is, no badges
            for song in songs:
                song["ml_score"] = 0.0
                song["reason"]   = None
                song["ml_badge"] = False
            return songs

        user_profile = build_user_profile(favorites, history)
        logger.info(f"[CBF] User profile keys: {list(user_profile.keys())[:10]}")

        scored = []
        for song in songs:
            vec   = build_song_vector(song)
            score = cosine_similarity(user_profile, vec)

            # Derive a human-readable reason for the top match dimension
            artist  = (song.get("artist") or "").strip()
            genre   = (song.get("genre")  or "").strip()
            reason  = None

            artist_w = user_profile.get(f"artist:{artist.lower()}", 0)
            genre_w  = user_profile.get(f"genre:{genre}", 0)

            if artist_w > 0:
                reason = f"You like {artist}"
            elif genre_w > 0:
                reason = f"Matches your {genre} taste"

            scored.append({
                **song,
                "ml_score": round(score, 6),
                "reason":   reason,
                "ml_badge": score > 0,
            })

        scored.sort(key=lambda s: s["ml_score"], reverse=True)
        logger.info(f"[CBF] Top score: {scored[0]['ml_score'] if scored else 'N/A'}")
        return scored


# ---------------------------------------------------------------------------
# Item-Based Collaborative Recommender
# ---------------------------------------------------------------------------

class CollaborativeRecommender:
    """
    Simulates item-based collaborative filtering using the user's own
    listening history as co-occurrence signal.

    Logic:
      If the user listened to artists A, B, A, C in sequence, then
      A & B co-occur twice, A & C co-occur once, B & C co-occur once.
      Given a seed artist, we surface the most co-occurring artists and
      fetch their songs — "because you like X, try Y".
    """

    def build_cooccurrence(self, history, window=5):
        """
        Build a dict `{(artist_a, artist_b): count}` from listen history.
        Only considers pairs within a sliding `window` of consecutive plays.
        """
        artists = [
            (s.get("artist") or "").strip().lower()
            for s in history
            if (s.get("artist") or "").strip()
        ]
        cooccurrence = {}
        for i, a in enumerate(artists):
            for j in range(i + 1, min(i + window, len(artists))):
                b = artists[j]
                if a == b:
                    continue
                pair = tuple(sorted([a, b]))
                cooccurrence[pair] = cooccurrence.get(pair, 0) + 1
        return cooccurrence

    def find_similar_artists(self, seed_artist, history, top_n=3):
        """
        Return the top `top_n` artists that most often co-occur with
        `seed_artist` in the listen history.
        """
        seed = (seed_artist or "").strip().lower()
        cooccurrence = self.build_cooccurrence(history)

        related = {}
        for (a, b), count in cooccurrence.items():
            if a == seed:
                related[b] = related.get(b, 0) + count
            elif b == seed:
                related[a] = related.get(a, 0) + count

        sorted_artists = sorted(related.items(), key=lambda x: x[1], reverse=True)
        logger.info(f"[CF] Seed='{seed_artist}' co-occurring artists: {sorted_artists[:top_n]}")
        return [artist for artist, _ in sorted_artists[:top_n]]
