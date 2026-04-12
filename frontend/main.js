document.addEventListener('DOMContentLoaded', () => {
    const moodCards = document.querySelectorAll('.mood-card');
    const songsContainer = document.getElementById('songs-container');
    const loader = document.getElementById('loader');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const btnSeeAll = document.getElementById('btn-see-all');
    const sectionTitle = document.getElementById('section-title');
    const navFavorites = document.getElementById('nav-favorites');
    const navHistory = document.getElementById('nav-history');
    const navHome = document.getElementById('nav-home');
    const navExplore = document.getElementById('nav-explore');
    
    // Audio Player Elements
    const miniPlayer = document.getElementById('mini-player');
    const audioElement = document.getElementById('audio-element');
    const playerImg = document.getElementById('player-img');
    const playerTitle = document.getElementById('player-title');
    const playerArtist = document.getElementById('player-artist');
    const playerPlayBtn = document.getElementById('player-play-btn');
    const playerNextBtn = document.getElementById('player-next-btn');
    const playerPrevBtn = document.getElementById('player-prev-btn');
    const playerProgress = document.getElementById('player-progress');
    const playerCurrentTime = document.getElementById('player-current-time');
    const playerCloseBtn = document.getElementById('player-close-btn');

    let currentPlayingCard = null;
    let currentMood = null;
    let currentPlaylist = [];
    let currentIndex = -1;

    // --- State Helpers ---
    const getFavorites = () => JSON.parse(localStorage.getItem('moodify_favorites')) || [];
    const saveFavorite = (song) => {
        const favs = getFavorites();
        if (!favs.find(s => s.id === song.id)) {
            favs.push(song);
            localStorage.setItem('moodify_favorites', JSON.stringify(favs));
        }
    };
    const removeFavorite = (songId) => {
        const favs = getFavorites().filter(s => s.id !== songId);
        localStorage.setItem('moodify_favorites', JSON.stringify(favs));
    };
    const getHistory = () => JSON.parse(localStorage.getItem('moodify_history')) || [];
    const addToHistory = (song) => {
        let history = getHistory();
        // Remove if exists to move to top
        history = history.filter(s => s.id !== song.id);
        history.unshift(song);
        if (history.length > 50) history.pop();
        localStorage.setItem('moodify_history', JSON.stringify(history));
    };

    // Handle Mood Selection
    moodCards.forEach(card => {
        card.addEventListener('click', async () => {
            // Reset all cards
            moodCards.forEach(c => {
                c.classList.remove('active-mood', c.dataset.border, c.dataset.glow, 'scale-105', 'bg-gray-700/80');
            });

            // Activate clicked card
            card.classList.add('active-mood', card.dataset.border, card.dataset.glow, 'scale-105', 'bg-gray-700/80');
            
            const mood = card.dataset.mood;
            currentMood = mood;
            sectionTitle.textContent = `${mood.charAt(0).toUpperCase() + mood.slice(1)} Hollywood Picks`;
            btnSeeAll.textContent = "See all for this mood";
            fetchSongsByMood(mood);
        });
    });

    // Handle Playlist (Curated For You) Selection
    const playlistCards = document.querySelectorAll('.playlist-card');
    playlistCards.forEach(card => {
        card.addEventListener('click', () => {
            const mood = card.dataset.mood;
            currentMood = mood;
            sectionTitle.textContent = `${mood.charAt(0).toUpperCase() + mood.slice(1)} Hollywood Hits`;
            btnSeeAll.textContent = "See all for this mood";
            fetchSongsByMood(mood);
            document.getElementById('songs-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });

    // Handle Search
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
            currentMood = null;
            const query = searchInput.value.trim();
            sectionTitle.textContent = `Results for "${query}"`;
            btnSeeAll.textContent = "Search similar";
            fetchSongsBySearch(query);
        }
    });

    // Handle Navigation
    navFavorites.addEventListener('click', (e) => {
        e.preventDefault();
        currentMood = null;
        sectionTitle.textContent = "Your Favorites";
        btnSeeAll.textContent = "Discover more";
        const favs = getFavorites();
        currentPlaylist = favs;
        renderSongs(favs);
        emptyState.classList.add('hidden');
        songsContainer.classList.remove('hidden');
    });

    navHistory.addEventListener('click', (e) => {
        e.preventDefault();
        currentMood = null;
        sectionTitle.textContent = "Recently Played";
        btnSeeAll.textContent = "Clear History";
        const history = getHistory();
        currentPlaylist = history;
        renderSongs(history);
        emptyState.classList.add('hidden');
        songsContainer.classList.remove('hidden');
    });

    btnSeeAll.addEventListener('click', () => {
        if (btnSeeAll.textContent === "Clear History") {
            localStorage.setItem('moodify_history', '[]');
            renderSongs([]);
            return;
        }
        
        if (currentMood) {
            fetchSongsByMood(currentMood, 50); // Expand to 50 songs
            songsContainer.classList.remove('flex', 'space-x-6', 'overflow-x-auto');
            songsContainer.classList.add('grid', 'grid-cols-2', 'md:grid-cols-4', 'lg:grid-cols-5', 'gap-6', 'overflow-y-visible');
        } else {
            // Default expansion
            fetchSongsBySearch("top english hits", 40);
        }
    });

    // Reset view for Home
    const resetView = () => {
        songsContainer.classList.add('flex', 'space-x-6', 'overflow-x-auto');
        songsContainer.classList.remove('grid', 'grid-cols-2', 'md:grid-cols-4', 'lg:grid-cols-5', 'gap-6', 'overflow-y-visible');
    };

    async function fetchSongsByMood(mood, limit = 15) {
        resetView();
        uiLoadState();
        try {
            const response = await fetch(`http://localhost:5000/api/recommend?mood=${mood}&limit=${limit}`);
            if (!response.ok) throw new Error('API Request Failed');
            const data = await response.json();
            handleSongsResponse(data);
        } catch (error) {
            console.error(error);
            showError("Failed to fetch songs. Is the backend running?");
        }
    }

    async function fetchSongsBySearch(query, limit = 15) {
        resetView();
        uiLoadState();
        try {
            const response = await fetch(`http://localhost:5000/api/search?q=${query}&limit=${limit}`);
            if (!response.ok) throw new Error('API Request Failed');
            const data = await response.json();
            handleSongsResponse(data);
        } catch (error) {
            console.error(error);
            showError("Search failed.");
        }
    }

    function uiLoadState() {
        emptyState.classList.add('hidden');
        songsContainer.classList.add('hidden');
        loader.classList.remove('hidden');
        songsContainer.innerHTML = '';
    }

    function handleSongsResponse(data) {
        if (data.songs && data.songs.length > 0) {
            currentPlaylist = data.songs;
            renderSongs(data.songs);
            loader.classList.add('hidden');
            songsContainer.classList.remove('hidden');
        } else {
            showError("No songs found.");
        }
    }

    function renderSongs(songs) {
        songsContainer.innerHTML = '';
        const favorites = getFavorites();
        
        songs.forEach((song, index) => {
            // Guard against missing previews
            if (!song.preview_url) return;

            const isFav = favorites.find(s => s.id === song.id);

            const card = document.createElement('div');
            card.className = 'song-card flex-shrink-0 bg-gray-800/40 rounded-xl p-3 shrink-0 hover:bg-gray-700/50 transition-all cursor-pointer group relative';
            card.innerHTML = `
                <div class="relative w-full aspect-square rounded-lg overflow-hidden shadow-lg mb-3">
                    <img src="${song.image || 'https://via.placeholder.com/150'}" alt="${song.title}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button class="play-overlay w-12 h-12 bg-purple-500 hover:bg-purple-400 rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(168,85,247,0.6)] transform group-hover:scale-105 transition">
                            <i class="fa-solid fa-play ml-1 text-lg"></i>
                        </button>
                    </div>
                </div>
                <h4 class="font-bold text-sm text-white truncate px-1">${song.title}</h4>
                <p class="text-xs text-gray-400 truncate px-1 mt-1">${song.artist}</p>
                <button class="favorite-btn absolute bottom-3 right-3 ${isFav ? 'text-pink-500' : 'text-gray-500'} hover:text-pink-400 transition">
                    <i class="fa-solid fa-heart"></i>
                </button>
            `;

            // Make the entire card clickable to play the song
            card.addEventListener('click', () => {
                playSong(song, card);
            });

            // Play Button Event Listener
            const playBtn = card.querySelector('.play-overlay');
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                playSong(song, card);
            });

            // Favorite Button Listener
            const favBtn = card.querySelector('.favorite-btn');
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const currentlyFav = favBtn.classList.contains('text-pink-500');
                if (currentlyFav) {
                    removeFavorite(song.id);
                    favBtn.classList.replace('text-pink-500', 'text-gray-500');
                } else {
                    saveFavorite(song);
                    favBtn.classList.replace('text-gray-500', 'text-pink-500');
                }
            });

            songsContainer.appendChild(card);
        });
    }

    function showError(msg) {
        loader.classList.add('hidden');
        songsContainer.classList.remove('hidden');
        songsContainer.innerHTML = `<div class="w-full py-10 text-center text-red-400"><i class="fa-solid fa-triangle-exclamation mb-2 text-2xl"></i><br>${msg}</div>`;
    }

    // --- Audio Player Logic ---

    async function playSong(song, cardElement = null) {
        if (!song) return;
        
        console.log("Play Request for:", song.title, "by:", song.artist);

        // 1. Logic for Toggling Same Song
        if (audioElement.src === song.preview_url) {
            if (audioElement.paused) {
                try {
                    await audioElement.play();
                    playerPlayBtn.innerHTML = '<i class="fa-solid fa-pause text-lg"></i>';
                } catch (e) {
                    console.error("Resume failed:", e);
                }
            } else {
                audioElement.pause();
                playerPlayBtn.innerHTML = '<i class="fa-solid fa-play ml-0.5 text-lg"></i>';
            }
            return;
        }

        // 2. Clear Existing State Completely
        try {
            audioElement.pause();
            audioElement.currentTime = 0;
            // Clear previous highlighting
            if(currentPlayingCard) {
                currentPlayingCard.classList.remove('ring-2', 'ring-purple-500');
            }
        } catch (e) { console.warn("Audio reset warning:", e); }

        // 3. Update UI Immediately with new metadata
        miniPlayer.classList.remove('translate-y-full');
        playerImg.src = song.image || 'https://via.placeholder.com/150';
        playerTitle.textContent = song.title || 'Unknown Track';
        playerArtist.textContent = song.artist || 'Unknown Artist'; // Force update artist
        
        // Reset progress
        playerProgress.style.width = '0%';
        playerCurrentTime.textContent = '0:00';
        
        // 4. Update index and highlights
        currentIndex = currentPlaylist.findIndex(s => s.id === song.id);
        
        if (cardElement) {
            currentPlayingCard = cardElement;
            cardElement.classList.add('ring-2', 'ring-purple-500');
        } else {
            const allCards = document.querySelectorAll('.song-card');
            if (currentIndex !== -1 && allCards[currentIndex]) {
                currentPlayingCard = allCards[currentIndex];
                currentPlayingCard.classList.add('ring-2', 'ring-purple-500');
                currentPlayingCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }

        // 5. Load and Play with Buffer Wait
        try {
            audioElement.src = song.preview_url;
            
            // Wait for enough metadata to be loaded to avoid playback race conditions
            await new Promise((resolve) => {
                const onMetadata = () => {
                    audioElement.removeEventListener('loadedmetadata', onMetadata);
                    resolve();
                };
                audioElement.addEventListener('loadedmetadata', onMetadata);
                // Safety timeout
                setTimeout(resolve, 1000);
            });

            await audioElement.play();
            playerPlayBtn.innerHTML = '<i class="fa-solid fa-pause text-lg"></i>';
            addToHistory(song);
        } catch (error) {
            console.error("Critical Playback Error:", error);
            playerPlayBtn.innerHTML = '<i class="fa-solid fa-play ml-0.5 text-lg"></i>';
        }
    }

    function playNext() {
        if (currentPlaylist.length === 0) return;
        currentIndex = (currentIndex + 1) % currentPlaylist.length;
        playSong(currentPlaylist[currentIndex]);
    }

    function playPrevious() {
        if (currentPlaylist.length === 0) return;
        currentIndex = (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
        playSong(currentPlaylist[currentIndex]);
    }

    playerNextBtn.addEventListener('click', playNext);
    playerPrevBtn.addEventListener('click', playPrevious);

    // Main Play/Pause Button
    playerPlayBtn.addEventListener('click', () => {
        if (audioElement.paused) {
            audioElement.play();
            playerPlayBtn.innerHTML = '<i class="fa-solid fa-pause text-lg"></i>';
        } else {
            audioElement.pause();
            playerPlayBtn.innerHTML = '<i class="fa-solid fa-play ml-0.5 text-lg"></i>';
        }
    });

    // Close Player
    playerCloseBtn.addEventListener('click', () => {
        audioElement.pause();
        miniPlayer.classList.add('translate-y-full');
        if(currentPlayingCard) {
            currentPlayingCard.classList.remove('ring-2', 'ring-purple-500');
            currentPlayingCard = null;
        }
    });

    // Update Progress Bar
    audioElement.addEventListener('timeupdate', () => {
        const currentTime = audioElement.currentTime;
        const duration = audioElement.duration || 30; // Previews are generally 30s
        
        // Format time (0:XX)
        const formatTime = (time) => {
            const secs = Math.floor(time);
            return `0:${secs < 10 ? '0' : ''}${secs}`;
        };
        
        playerCurrentTime.textContent = formatTime(currentTime);
        
        // Update progress bar width
        const progressPercent = (currentTime / duration) * 100;
        playerProgress.style.width = `${progressPercent}%`;
    });

    // Reset when ended
    audioElement.addEventListener('ended', () => {
        playNext();
    });
});
