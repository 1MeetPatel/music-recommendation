# 🎵 Moodify

Moodify is a high-fidelity, Spotify-inspired music discovery platform built with a beautifully responsive vanilla frontend and a Python Flask backend. 

Experience top trending hits, intelligent AI-powered music recommendations, and full-length ad-free audio streaming all housed within a gorgeous modern UI.

---

##  Features

- **🎧 Premium Playback Engine:** Seamless, full-length audio streaming powered by a headless YouTube IFrame integration.
- **📈 Dynamic Trending:** Discover what's hot right now. The app queries top English hits on every load and randomly curates a fresh, dynamic feed of popular tracks.
- **🧠 Intelligent "Music Picks":** Features built-in Content-Based filtering algorithms that learn from your active listening session to build personalized feed recommendations.
- **💡 "Because You Like" Suggestions:** A lightweight Collaborative Filtering simulation that matches your play history with similar artists and genres to recommend fresh tracks natively.
- **🔍 Global Explore:** Instantly search the iTunes database for any track, artist, or album. 
- **📚 Personal Library:** Easily save tracks to your **Favorites** ❤️ and automatically track your recently played songs in your **History**, keeping your ultimate playlist safe across sessions via local storage.
- **💎 Stunning UI/UX:** Built meticulously with Tailwind CSS and custom vanilla JavaScript for smooth glassmorphism effects, synced micro-animations, and dynamic scalable components.

---

##  Technology Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3, Tailwind CSS, FontAwesome
- **Backend Server:** Python, Flask
- **Data & Audio Sources:** iTunes Search API (Metadata & Artwork), YouTube Data / IFrame API (Audio Engine)
- **Database:** Browser LocalStorage (Favorites & History persistence)

---

##  Getting Started

### Prerequisites
Make sure you have Python 3 installed on your system.

### 1. Installation
Clone the repository to your local machine:
```bash
git clone https://github.com/1MeetPatel/music-recommendation.git
cd music-recommendation
```

### 2. Install Dependencies
Install the required Python packages for the backend server:
```bash
pip install flask requests
```

### 3. Launch the Application
Start the backend API and serve the web application. You can simply double-click the included run script if you are on Windows:
```bash
run.bat
```
*(Alternatively, you can manually run `python backend/app.py` in your terminal).*

### 4. Open in Browser
To ensure the YouTube audio engine bypasses browser security restrictions correctly, the application **must** be opened through the local web server. 

Navigate to:
```
http://localhost:5000
```

---

##  Important Notes
- Avoid opening `index.html` directly via double-clicking in your file explorer (`file:///`). This triggers strict browser security protocols that permanently block YouTube from embedding audio. You **must** view the app via `localhost:5000`.
- The application focuses on all types of music.

---

*Designed and developed for a premium music listening experience.*
