document.addEventListener('DOMContentLoaded', () => {
    const moodCards = document.querySelectorAll('.mood-card');
    const songsContainer = document.getElementById('songs-container');
    const loader = document.getElementById('loader');
    const emptyState = document.getElementById('empty-state');
    
    // Audio Player Elements
    const miniPlayer = document.getElementById('mini-player');
    const audioElement = document.getElementById('audio-element');
    const playerImg = document.getElementById('player-img');
    const playerTitle = document.getElementById('player-title');
    const playerArtist = document.getElementById('player-artist');
    const playerPlayBtn = document.getElementById('player-play-btn');
    const playerProgress = document.getElementById('player-progress');
    const playerCurrentTime = document.getElementById('player-current-time');
    const playerCloseBtn = document.getElementById('player-close-btn');

    let currentPlayingCard = null;

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
            fetchSongsByMood(mood);
        });
    });

    // Handle Playlist (Curated For You) Selection
    const playlistCards = document.querySelectorAll('.playlist-card');
    playlistCards.forEach(card => {
        card.addEventListener('click', () => {
            const mood = card.dataset.mood;
            fetchSongsByMood(mood);
            document.getElementById('songs-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });

    async function fetchSongsByMood(mood) {
        // UI State update
        emptyState.classList.add('hidden');
        songsContainer.classList.add('hidden');
        loader.classList.remove('hidden');
        songsContainer.innerHTML = '';

        try {
            const response = await fetch(`http://localhost:5000/api/recommend?mood=${mood}`);
            if (!response.ok) throw new Error('API Request Failed');
            
            const data = await response.json();
            
            if (data.songs && data.songs.length > 0) {
                renderSongs(data.songs);
                loader.classList.add('hidden');
                songsContainer.classList.remove('hidden');
            } else {
                showError("No songs found for this mood with previews.");
            }
        } catch (error) {
            console.error(error);
            showError("Failed to fetch songs. Is the backend running?");
        }
    }

    function renderSongs(songs) {
        songsContainer.innerHTML = '';
        
        songs.forEach((song, index) => {
            // Guard against missing previews
            if (!song.preview_url) return;

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
                <button class="absolute bottom-3 right-3 text-gray-500 hover:text-pink-500 transition">
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

            songsContainer.appendChild(card);
        });
    }

    function showError(msg) {
        loader.classList.add('hidden');
        songsContainer.classList.remove('hidden');
        songsContainer.innerHTML = `<div class="w-full py-10 text-center text-red-400"><i class="fa-solid fa-triangle-exclamation mb-2 text-2xl"></i><br>${msg}</div>`;
    }

    // --- Audio Player Logic ---

    function playSong(song, cardElement) {
        // Update Mini Player UI
        playerImg.src = song.image || 'https://via.placeholder.com/150';
        playerTitle.textContent = song.title;
        playerArtist.textContent = song.artist;
        
        // Load Audio
        audioElement.src = song.preview_url;
        audioElement.play();
        
        // Show Player (slide up)
        miniPlayer.classList.remove('translate-y-full');
        
        // Update Play Button Icon
        playerPlayBtn.innerHTML = '<i class="fa-solid fa-pause text-lg"></i>';
        
        // Visual indicator on card (optional)
        if(currentPlayingCard) {
            currentPlayingCard.classList.remove('ring-2', 'ring-purple-500');
        }
        currentPlayingCard = cardElement;
        cardElement.classList.add('ring-2', 'ring-purple-500');
    }

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
        playerPlayBtn.innerHTML = '<i class="fa-solid fa-play ml-0.5 text-lg"></i>';
        playerProgress.style.width = '0%';
        playerCurrentTime.textContent = '0:00';
    });
});
