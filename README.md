#  Moodify — AI-Powered Mood-Based Music Player

<div align="center">

![Moodify Banner](https://img.shields.io/badge/Moodify-Music%20App-1DB954?style=for-the-badge&logo=apple-music&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0.3-000000?style=for-the-badge&logo=flask&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![iTunes API](https://img.shields.io/badge/iTunes-Search%20API-FB5C74?style=for-the-badge&logo=apple&logoColor=white)

**Discover Hollywood music that matches your mood — now with AI-powered personalisation.**

</div>

---

##  Overview

Moodify is a full-stack music discovery web app with a Spotify-inspired dark UI. Pick a mood, and Moodify fetches real songs from the iTunes Search API. The more you listen, the smarter it gets — using content-based filtering and collaborative filtering to personalise your recommendations.

---

##  Features

| Feature | Description |
|---|---|
| 🎭 **Mood Selection** | 7 moods: Happy, Sad, Relaxed, Energetic, Romantic, Angry, Focus |
| 🔍 **Live Search** | Debounced real-time search with quick-chip suggestions on the Explore page |
| 🎬 **Hollywood Songs** | Dedicated page with genre filters (Pop, Rock, R&B, Hip-Hop, Indie, Charts) |
| ▶️ **Built-in Player** | Mini audio player with prev/next, progress bar, and 30-second song previews |
| ❤️ **Favorites** | Save songs; synced between cards and the mini player |
| 🕐 **History** | Tracks up to 50 recently played songs with a clear option |
| 👤 **User Profile** | Set a username and upload a profile photo stored locally |
| 🖱️ **Custom Cursor** | Animated green cursor with smooth aura-follow effect |
| ✨ **Smart Mode** | AI toggle that auto-enables when you have enough listening data |
| 🎯 **Picked For You** | Content-based personalised row that re-ranks songs by your taste |
| 💡 **Because You Like** | Collaborative filtering row that surfaces artists you tend to enjoy together |

---

##  Machine Learning — How It Works

Moodify uses **two real ML algorithms** implemented in pure Python (no ML libraries required):

### 1. Content-Based Filtering (`ContentBasedRecommender`)

Builds a **weighted user profile** from your listening data and re-ranks mood-based song candidates using **cosine similarity**.

**Feature vector per song:**
```
genre:Rock    → 1.0
artist:Coldplay → 1.0
dur:medium    → 0.5
```

**User profile** (sparse weighted vector):
```
Favorites  → ×3 weight   (explicit preference)
History    → ×1 weight   (implicit play signal)
```

**Cosine similarity** between user profile and each song vector determines the ranked order. Songs also receive a reason label: *"You like Coldplay"* or *"Matches your Rock taste"*.

---

### 2. Item-Based Collaborative Filtering (`CollaborativeRecommender`)

Builds an **artist co-occurrence matrix** from your listen history using a sliding window of 5 consecutive plays.

```
Listen history: [Coldplay → Ed Sheeran → Coldplay → The Weeknd]

Co-occurrences:
  (Coldplay, Ed Sheeran) → 2
  (Coldplay, The Weeknd) → 1
  (Ed Sheeran, The Weeknd) → 1
```

When you play a song, Moodify finds the **top co-occurring artists** with that song's artist and fetches their songs — powering the **"Because You Like [Artist]"** row.

> **Auto-enables:** Smart Mode turns on automatically when you have ≥ 3 favorites or ≥ 5 plays.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Vanilla CSS, JavaScript (ES6+) |
| **Styling** | TailwindCSS CDN, FontAwesome 6, Google Fonts (Inter) |
| **Backend** | Python 3, Flask 3.0.3, Flask-CORS |
| **Music API** | iTunes Search API (free, no auth required) |
| **ML Engine** | Pure Python — `math` module only, no numpy/sklearn |
| **Storage** | Browser `localStorage` (favorites, history, profile) |

---

## 📁 Project Structure

```
music-recommendation/
│
├── backend/
│   ├── app.py                   # Flask server + all API endpoints
│   ├── spotify_service.py       # iTunes API integration + song fetching
│   ├── recommendation_engine.py # ML: content-based + collaborative filtering
│   ├── requirements.txt         # Python dependencies
│   ├── test_endpoint.py         # API endpoint tests
│   └── test_spotify.py          # iTunes service tests
│
├── frontend/
│   ├── index.html               # Full single-page app UI
│   ├── main.js                  # All app logic, ML integration, audio player
│   ├── style.css                # Custom styles, animations, ML badges
│   └── party_hits.png           # Playlist card image
│
└── run.bat                      # One-click Windows launcher
```

---

##  API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/recommend?mood=happy&limit=15` | Mood-based songs (rule-based) |
| `GET` | `/api/search?q=coldplay&limit=15` | Search songs by keyword |
| `POST` | `/api/smart-recommend` | **ML** — content-based re-ranked songs |
| `GET` | `/api/because-you-liked?artist=Coldplay&genre=Rock&history=[...]` | **ML** — collaborative filtering suggestions |

### POST `/api/smart-recommend` — Request Body
```json
{
  "mood": "happy",
  "favorites": [{ "id": "...", "artist": "Coldplay", "genre": "Rock", "duration_ms": 200000 }],
  "history":   [{ "id": "...", "artist": "Ed Sheeran", "genre": "Pop", "duration_ms": 180000 }],
  "limit": 15
}
```

### Response
```json
{
  "songs": [
    {
      "id": "123",
      "title": "Yellow",
      "artist": "Coldplay",
      "genre": "Rock",
      "image": "...",
      "preview_url": "...",
      "ml_score": 0.973329,
      "reason": "You like Coldplay",
      "ml_badge": true
    }
  ],
  "personalized": true
}
```

---

##  Supported Moods

| Mood | iTunes Search Keyword |
|---|---|
| 😊 Happy | `happy english songs` |
| 😢 Sad | `sad english songs` |
| 😌 Relaxed | `chill english songs` |
| ⚡ Energetic | `workout english songs` |
| ❤️ Romantic | `romantic english songs` |
| 😡 Angry | `rock english songs` |
| 🎯 Focus | `instrumental english songs` |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- A modern browser (Chrome/Edge/Firefox)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/1MeetPatel/music-recommendation.git
cd music-recommendation

# 2. Install Python dependencies
pip install -r backend/requirements.txt
```

### Running the App

**Option A — One Click (Windows)**
```
Double-click run.bat
```

**Option B — Manual**
```bash
# Terminal 1: Start backend
cd backend
python app.py

# Terminal 2 (or just open in browser):
# Navigate to http://localhost:5000
```

The app will be available at **http://localhost:5000**

---

##  How Smart Mode Works (End to End)

```
User opens app
    │
    ▼
localStorage checked → favs ≥ 3 or history ≥ 5?
    │ YES                         │ NO
    ▼                             ▼
Smart Mode AUTO-ON         Smart Mode OFF (toggle manually)
    │
    ▼
User clicks a Mood card
    │
    ▼
POST /api/smart-recommend
  ├─ Fetch 80 candidates from iTunes
  ├─ Build user profile (genre/artist/duration weighted vector)
  ├─ Cosine similarity score each candidate
  └─ Return top 15 ranked + reason labels
    │
    ▼
"✨ Smart Mix · Happy" main row  +  "🎯 Picked For You" row

User plays a song
    │
    ▼
GET /api/because-you-liked?artist=Coldplay
  ├─ Build artist co-occurrence matrix from last 30 plays
  ├─ Find top 3 artists co-occurring with Coldplay
  ├─ Fetch songs by those artists
  └─ Return + reason: "Because you like Coldplay"
    │
    ▼
"💡 Because You Like Coldplay" row slides in
```

---

##  Possible Future Enhancements

- [ ] Spotify OAuth integration for real streaming
- [ ] Mood detection via typed text (NLP sentiment analysis)
- [ ] Multi-user backend with shared collaborative filtering
- [ ] Mobile responsive layout / PWA support
- [ ] Playlist creation and sharing

---

##  License

This project is open source and available under the [MIT License](LICENSE).

---

##  Acknowledgements

- [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/) — free music metadata and 30-second previews
- [Flask](https://flask.palletsprojects.com/) — lightweight Python web framework
- [TailwindCSS](https://tailwindcss.com/) — utility-first CSS framework
- [FontAwesome](https://fontawesome.com/) — icon library
- Spotify — UI/UX design inspiration

---

<div align="center">
  Made with ❤️ and 🎵
</div>
