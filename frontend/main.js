let ytPlayer           = null;
let ytPlayerReady      = false;
let progressInterval   = null;
const API_BASE         = window.location.protocol === 'file:' ? 'http://localhost:5000' : '';

// --- Global Progress Logic (Accessible by onYouTubeIframeAPIReady) ---
function startProgressInterval() {
    clearInterval(progressInterval);
    progressInterval = setInterval(() => {
        if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function' && typeof ytPlayer.getDuration === 'function') {
            const cur = ytPlayer.getCurrentTime();
            const dur = ytPlayer.getDuration();
            
            const curTimeEl = document.getElementById('player-current-time');
            const totalTimeEl = document.getElementById('player-total-time');
            const progressEl = document.getElementById('player-progress');

            const fmt = (t) => {
                if (isNaN(t) || t < 0) return '0:00';
                const m = Math.floor(t / 60);
                const s = Math.floor(t % 60);
                return `${m}:${s < 10 ? '0' : ''}${s}`;
            };

            if (curTimeEl && !isNaN(cur)) {
                curTimeEl.textContent = fmt(cur);
            }

            if (!isNaN(dur) && dur > 0) {
                if (totalTimeEl) totalTimeEl.textContent = fmt(dur);
                if (progressEl) progressEl.style.width = `${(cur / dur) * 100}%`;
            }
        }
    }, 500);
}

// YouTube API Callback (must be global/top-level)
window.onYouTubeIframeAPIReady = () => {
    console.log('YouTube API Loaded, initializing player...');
    ytPlayer = new YT.Player('youtube-player', {
        height: '1',
        width: '1',
        videoId: '',
        playerVars: {
            'playsinline': 1,
            'controls': 0,
            'disablekb': 1,
            'fs': 0,
            'modestbranding': 1,
            'rel': 0,
            'origin': window.location.origin,
            'autoplay': 1
        },
        events: {
            'onReady': () => {
                ytPlayerReady = true;
                console.log('YouTube Player Ready');
            },
            'onStateChange': (event) => {
                const playBtn = document.getElementById('player-play-btn');
                const timeStr = document.getElementById('player-current-time');
                const statusDebug = document.getElementById('player-status-debug');

                const states = {
                    [-1]: 'Unstarted',
                    [0]:  'Ended',
                    [1]:  'Playing',
                    [2]:  'Paused',
                    [3]:  'Buffering',
                    [5]:  'Video Cued'
                };
                if (statusDebug) statusDebug.textContent = `Player: ${states[event.data] || event.data}`;

                if (event.data === YT.PlayerState.PLAYING) {
                    playBtn.innerHTML = '<i class="fa-solid fa-pause text-lg"></i>';
                    startProgressInterval();
                    if (statusDebug) statusDebug.classList.add('text-green-500');
                    if (statusDebug) statusDebug.classList.remove('text-orange-400');
                } else if (event.data === YT.PlayerState.PAUSED) {
                    playBtn.innerHTML = '<i class="fa-solid fa-play ml-0.5 text-lg"></i>';
                    clearInterval(progressInterval);
                    if (statusDebug) statusDebug.classList.remove('text-green-500');
                } else if (event.data === YT.PlayerState.BUFFERING) {
                    playBtn.innerHTML = '<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>';
                    // Don't overwrite if we already have a meaningful time
                    if (timeStr.textContent === '0:00') timeStr.textContent = '...';
                } else if (event.data === YT.PlayerState.ENDED) {
                    if (window.playNext) window.playNext();
                } else if (event.data === YT.PlayerState.CUED) {
                    if (statusDebug) {
                        statusDebug.textContent = 'Interaction Required: Click to Play';
                        statusDebug.classList.add('text-orange-400');
                    }
                    ytPlayer.playVideo(); 
                }
            },
            'onError': (e) => {
                console.error('YouTube Player Error:', e.data);
                const statusDebug = document.getElementById('player-status-debug');
                const errors = {
                    2: 'Invalid ID',
                    5: 'HTML5 player error',
                    100: 'Video not found',
                    101: 'Blocked from embedding',
                    150: 'Blocked from embedding'
                };
                const msg = errors[e.data] || 'Playback issue';
                if (statusDebug) {
                    statusDebug.textContent = `Error: ${msg}`;
                    statusDebug.classList.add('text-red-500');
                }
                alert(`Playback Error: ${msg}. Try another song.`);
                const playBtn = document.getElementById('player-play-btn');
                playBtn.innerHTML = '<i class="fa-solid fa-play ml-0.5 text-lg"></i>';
            }
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    // =============================================
    // DOM REFERENCES
    // =============================================
    const trendingContainer = document.getElementById('trending-container');
    const trendingLoader    = document.getElementById('trending-loader');
    const songsContainer   = document.getElementById('songs-container');
    const loader           = document.getElementById('loader');

    const sectionTitle     = document.getElementById('section-title');
    const navFavorites     = document.getElementById('nav-favorites');
    const navHistory       = document.getElementById('nav-history');
    const navHome          = document.getElementById('nav-home');
    const navExplore       = document.getElementById('nav-explore');

    const dynamicGreeting  = document.getElementById('dynamic-greeting');

    // =============================================
    // ML / SMART MODE REFERENCES
    // =============================================
    const smartModeToggle  = document.getElementById('smart-mode-toggle');
    const smartModeLabel   = document.getElementById('smart-mode-label');
    const smartModeDot     = document.getElementById('smart-mode-dot');
    const sectionForYou    = document.getElementById('section-for-you');
    const forYouLoader     = document.getElementById('for-you-loader');
    const forYouContainer  = document.getElementById('for-you-container');
    const sectionBecause   = document.getElementById('section-because');
    const becauseTitle     = document.getElementById('because-title');
    const becauseLoader    = document.getElementById('because-loader');
    const becauseContainer = document.getElementById('because-container');

    // Smart Mode state (auto-enables when user has enough data)
    let smartModeOn = false;

    function setSmartMode(on) {
        smartModeOn = on;
        if (on) {
            smartModeLabel.textContent = 'Smart Mode: ON';
            smartModeDot.classList.replace('bg-gray-600', 'bg-[#1DB954]');
            smartModeToggle.classList.add('border-[#1DB954]/60', 'text-[#1DB954]');
            smartModeToggle.classList.remove('border-gray-700/50', 'text-gray-400');
        } else {
            smartModeLabel.textContent = 'Smart Mode: OFF';
            smartModeDot.classList.replace('bg-[#1DB954]', 'bg-gray-600');
            smartModeToggle.classList.remove('border-[#1DB954]/60', 'text-[#1DB954]');
            smartModeToggle.classList.add('border-gray-700/50', 'text-gray-400');
        }
    }

    // Auto-enable Smart Mode if user has enough history
    function checkAutoSmartMode() {
        const favs    = getFavorites();
        const history = getHistory();
        if (favs.length >= 3 || history.length >= 5) {
            setSmartMode(true);
        }
    }

    smartModeToggle.addEventListener('click', () => setSmartMode(!smartModeOn));

    // Explore page
    const pageExplore         = document.getElementById('page-explore');
    const exploreSearchInput  = document.getElementById('explore-search-input');
    const exploreLoader       = document.getElementById('explore-loader');
    const exploreEmpty        = document.getElementById('explore-empty');
    const exploreResults      = document.getElementById('explore-results');
    const exploreChips        = document.querySelectorAll('.explore-chip');


    // Check if on file:// protocol (YouTube playback restriction)
    if (window.location.protocol === 'file:') {
        const connBanner = document.getElementById('connection-banner');
        if (connBanner) connBanner.classList.remove('hidden');
        console.warn('Moodify is running on file:// protocol. Full tracks may be blocked by YouTube.');
    }



    // Main home page wrapper
    const pageHome = document.querySelector('.p-8.max-w-7xl.mx-auto');

    // Favorites page
    const pageFavorites = document.getElementById('page-favorites');
    const favEmpty      = document.getElementById('fav-empty');
    const favResults    = document.getElementById('fav-results');

    // History page
    const pageHistory     = document.getElementById('page-history');
    const historyEmpty    = document.getElementById('history-empty');
    const historyResults  = document.getElementById('history-results');
    const btnClearHistory = document.getElementById('btn-clear-history');

    // Audio Player
    const miniPlayer       = document.getElementById('mini-player');
    const audioElement     = document.getElementById('audio-element');
    const playerImg        = document.getElementById('player-img');
    const playerTitle      = document.getElementById('player-title');
    const playerArtist     = document.getElementById('player-artist');
    const playerPlayBtn    = document.getElementById('player-play-btn');
    const playerNextBtn    = document.getElementById('player-next-btn');
    const playerPrevBtn    = document.getElementById('player-prev-btn');
    const playerProgress   = document.getElementById('player-progress');
    const playerCurrentTime = document.getElementById('player-current-time');
    const playerCloseBtn   = document.getElementById('player-close-btn');
    const playerFavBtn     = document.getElementById('player-fav-btn');
    const playerTotalTime  = document.getElementById('player-total-time');
    const playerProgressContainer = document.getElementById('player-progress-container');
    const volumeSlider     = document.getElementById('volume-slider');
    const volumeProgress   = document.getElementById('volume-progress');
    const volumeBtn        = document.getElementById('player-volume-btn');
    const volumeIcon       = document.getElementById('volume-icon');


    let currentPlayingSong = null;
    let currentPlayingCard = null;
    let currentMood        = null;
    let currentPlaylist    = [];
    let currentIndex       = -1;


    // =============================================
    // DYNAMIC GREETING
    // =============================================
    const updateGreeting = () => {
        const hours = new Date().getHours();
        if (hours < 12) {
            dynamicGreeting.innerHTML = 'Good Morning <span class="text-2xl">☀️</span>';
        } else if (hours < 18) {
            dynamicGreeting.innerHTML = 'Good Afternoon <span class="text-2xl">🌤️</span>';
        } else {
            dynamicGreeting.innerHTML = 'Good Evening <span class="text-2xl">👋</span>';
        }
    };
    updateGreeting();

    // =============================================
    // PAGE NAVIGATION
    // =============================================
    const allPages = [pageHome, pageFavorites, pageHistory, pageExplore];
    const allNavLinks = [navHome, navExplore, navFavorites, navHistory];

    function showPage(targetPage, activeNav = null) {
        allPages.forEach(p => { if (p) p.classList.add('hidden'); });
        if (targetPage) targetPage.classList.remove('hidden');

        allNavLinks.forEach(link => {
            if (link) link.closest('li')?.classList.remove('active');
        });
        if (activeNav) activeNav.closest('li')?.classList.add('active');
    }

    showPage(pageHome, navHome);
    pageExplore.classList.add('hidden');
    initTrendingHits();

    navHome.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(pageHome, navHome);
    });

    navExplore.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(pageExplore, navExplore);
        exploreSearchInput.focus();
    });



    navFavorites.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(pageFavorites, navFavorites);
        const favs = getFavorites();
        currentPlaylist = favs;
        if (favs.length === 0) {
            favEmpty.classList.remove('hidden');
            favResults.innerHTML = '';
        } else {
            favEmpty.classList.add('hidden');
            renderSongs(favs, favResults);
        }
    });

    navHistory.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(pageHistory, navHistory);
        const history = getHistory();
        currentPlaylist = history;
        if (history.length === 0) {
            historyEmpty.classList.remove('hidden');
            historyResults.innerHTML = '';
        } else {
            historyEmpty.classList.add('hidden');
            renderSongs(history, historyResults);
        }
    });

    btnClearHistory.addEventListener('click', () => {
        localStorage.setItem('moodify_history', '[]');
        historyResults.innerHTML = '';
        historyEmpty.classList.remove('hidden');
    });

    // =============================================
    // STATE HELPERS
    // =============================================
    const getFavorites  = () => JSON.parse(localStorage.getItem('moodify_favorites')) || [];
    const saveFavorite  = (song) => {
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
    const getHistory   = () => JSON.parse(localStorage.getItem('moodify_history')) || [];
    const addToHistory = (song) => {
        let history = getHistory();
        history = history.filter(s => s.id !== song.id);
        history.unshift(song);
        if (history.length > 50) history.pop();
        localStorage.setItem('moodify_history', JSON.stringify(history));
    };

    // =============================================
    // HOME PAGE - MOOD SELECTION
    // =============================================
    // =============================================
    // TRENDING HITS SECTION
    // =============================================
    async function initTrendingHits() {
        trendingLoader.classList.remove('hidden');
        trendingContainer.classList.add('hidden');
        try {
            const res = await fetch(`${API_BASE}/api/trending?limit=14`);
            const data = await res.json();
            trendingLoader.classList.add('hidden');
            if (data.songs && data.songs.length > 0) {
                renderSongs(data.songs, trendingContainer);
                trendingContainer.classList.remove('hidden');
            }
        } catch (err) {
            console.error('Trending fetch failed:', err);
            trendingLoader.classList.add('hidden');
        }
    }





    const resetView = () => {
        songsContainer.classList.add('flex', 'space-x-6', 'overflow-x-auto');
        songsContainer.classList.remove('grid', 'grid-cols-2', 'md:grid-cols-4', 'lg:grid-cols-5', 'gap-6', 'overflow-y-visible');
    };

    // =============================================
    // EXPLORE PAGE
    // =============================================

    // Enter key search
    exploreSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && exploreSearchInput.value.trim()) {
            searchExplore(exploreSearchInput.value.trim());
        }
    });

    // Live suggestions while typing (debounced)
    let debounceTimer;
    exploreSearchInput.addEventListener('input', () => {
        const query = exploreSearchInput.value.trim();
        clearTimeout(debounceTimer);
        if (query.length >= 2) {
            debounceTimer = setTimeout(() => searchExplore(query), 500);
        } else if (query.length === 0) {
            exploreResults.classList.add('hidden');
            exploreEmpty.classList.remove('hidden');
        }
    });

    // Quick-chip buttons
    exploreChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const text = chip.textContent.replace(/^[^\w]+/, '').trim();
            exploreSearchInput.value = text;
            searchExplore(text);
        });
    });

    async function searchExplore(query) {
        exploreEmpty.classList.add('hidden');
        exploreResults.classList.add('hidden');
        exploreLoader.classList.remove('hidden');
        try {
            const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=30`);
            const data = await res.json();
            exploreLoader.classList.add('hidden');
            if (data.songs && data.songs.length > 0) {
                currentPlaylist = data.songs;
                renderSongs(data.songs, exploreResults);
                exploreResults.classList.remove('hidden');
            } else {
                exploreEmpty.innerHTML = '<i class="fa-solid fa-face-sad-tear text-5xl mb-4 text-gray-700"></i><p>No songs found. Try a different search.</p>';
                exploreEmpty.classList.remove('hidden');
            }
        } catch (err) {
            exploreLoader.classList.add('hidden');
            exploreEmpty.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-5xl mb-4 text-red-700"></i><p class="text-red-400">Search failed: ${err.message}</p>`;
            exploreEmpty.classList.remove('hidden');
        }
    }



    // =============================================
    // API FETCHERS (for Home page)
    // =============================================
    async function fetchSongsByMood(mood, limit = 15) {
        resetView();
        uiLoadState();
        try {
            const res = await fetch(`${API_BASE}/api/recommend?mood=${mood}&limit=${limit}`);
            if (!res.ok) throw new Error('API Failed');
            const data = await res.json();
            handleSongsResponse(data);
        } catch (err) {
            console.error(err);
            showError('Failed to fetch songs. Is the backend running?');
        }
    }

    // ─── Content-Based Smart Recommend ───────────────────────────────────────
    async function fetchSmartRecommend(mood, limit = 15) {
        resetView();
        uiLoadState();
        sectionTitle.textContent = `✨ Smart Mix · ${mood.charAt(0).toUpperCase() + mood.slice(1)}`;

        const favorites = getFavorites();
        const history   = getHistory();

        try {
            const res = await fetch(`${API_BASE}/api/smart-recommend`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ mood, favorites, history, limit }),
            });
            if (!res.ok) throw new Error('Smart recommend failed');
            const data = await res.json();
            handleSongsResponse(data);

            // After loading mood songs, also fetch the For You section
            fetchForYouSection(mood, favorites, history);
        } catch (err) {
            console.error(err);
            // Gracefully fall back to normal recommend
            fetchSongsByMood(mood, limit);
        }
    }

    // ─── For You Section (personalized horizontal row) ────────────────────────
    async function fetchForYouSection(mood, favorites, history) {
        if (!favorites.length && !history.length) return;

        sectionForYou.classList.remove('hidden');
        forYouLoader.classList.remove('hidden');
        forYouContainer.innerHTML = '';

        try {
            const res = await fetch(`${API_BASE}/api/smart-recommend`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ mood, favorites, history, limit: 20 }),
            });
            const data = await res.json();
            forYouLoader.classList.add('hidden');

            const songs = (data.songs || []).filter(s => s.ml_badge);
            if (songs.length > 0) {
                renderSongs(songs, forYouContainer, true);
            } else {
                sectionForYou.classList.add('hidden');
            }
        } catch (err) {
            forYouLoader.classList.add('hidden');
            sectionForYou.classList.add('hidden');
        }
    }

    // ─── Because You Liked Section (Collaborative Filtering) ─────────────────
    async function fetchBecauseYouLiked(artist, genre) {
        const history = getHistory();
        if (history.length < 2) return;  // Not enough data

        sectionBecause.classList.remove('hidden');
        becauseLoader.classList.remove('hidden');
        becauseContainer.innerHTML = '';

        // Update title
        const titleEl = becauseTitle;
        titleEl.innerHTML = `<span class="mr-2 text-lg">💡</span> Because You Like <span class="text-[#1DB954] ml-1">${artist}</span><span class="ml-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">CF</span>`;

        try {
            const params = new URLSearchParams({
                artist,
                genre:   genre || '',
                limit:   15,
                history: JSON.stringify(history.slice(0, 30)),  // last 30 plays
            });
            const res  = await fetch(`${API_BASE}/api/because-you-liked?${params}`);
            const data = await res.json();
            becauseLoader.classList.add('hidden');

            if (data.songs && data.songs.length > 0) {
                renderSongs(data.songs, becauseContainer, true);
            } else {
                sectionBecause.classList.add('hidden');
            }
        } catch (err) {
            becauseLoader.classList.add('hidden');
            sectionBecause.classList.add('hidden');
        }
    }

    async function fetchSongsBySearch(query, limit = 15) {
        resetView();
        uiLoadState();
        try {
            const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
            if (!res.ok) throw new Error('API Failed');
            const data = await res.json();
            handleSongsResponse(data);
        } catch (err) {
            console.error(err);
            showError('Search failed.');
        }
    }

    function uiLoadState() {
        if (trendingContainer) trendingContainer.classList.add('opacity-50');
        songsContainer.classList.add('hidden');
        loader.classList.remove('hidden');
        songsContainer.innerHTML = '';
    }

    function handleSongsResponse(data) {
        if (data.songs && data.songs.length > 0) {
            currentPlaylist = data.songs;
            renderSongs(data.songs, songsContainer);
            loader.classList.add('hidden');
            songsContainer.classList.remove('hidden');
        } else {
            showError('No songs found.');
        }
    }

    function showError(msg) {
        loader.classList.add('hidden');
        songsContainer.classList.remove('hidden');
        songsContainer.innerHTML = `<div class="w-full py-10 text-center text-red-400"><i class="fa-solid fa-triangle-exclamation mb-2 text-2xl"></i><br>${msg}</div>`;
    }

    // =============================================
    // RENDER SONGS (shared by all pages)
    // showReason = true → shows ML badge chip on card
    // =============================================
    function renderSongs(songs, container, showReason = false) {
        container.innerHTML = '';
        const favorites = getFavorites();

        songs.forEach((song) => {
            if (!song.preview_url) return;
            const isFav = favorites.find(s => s.id === song.id);

            // Build optional ML reason badge
            const reasonBadge = (showReason && song.reason)
                ? `<div class="ml-reason-badge">${song.reason}</div>`
                : '';

            const card = document.createElement('div');
            card.className = 'song-card flex-shrink-0 bg-gray-800/40 rounded-xl p-3 hover:bg-gray-700/50 transition-all cursor-pointer group relative';
            card.setAttribute('data-song-id', song.id);
            card.innerHTML = `
                <div class="relative w-full aspect-square rounded-lg overflow-hidden shadow-lg mb-3">
                    <img src="${song.image || 'https://via.placeholder.com/150'}" alt="${song.title}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button class="play-overlay w-12 h-12 bg-[#1DB954] hover:bg-[#1ed760] rounded-full flex items-center justify-center text-black shadow-lg transform group-hover:scale-105 transition">
                            <i class="fa-solid fa-play ml-1 text-lg"></i>
                        </button>
                    </div>
                    ${reasonBadge}
                </div>
                <h4 class="font-bold text-sm text-white truncate px-1">${song.title}</h4>
                <p class="text-xs text-gray-400 truncate px-1 mt-1">${song.artist}</p>
                <button class="favorite-btn absolute bottom-3 right-3 ${isFav ? 'text-[#1DB954]' : 'text-gray-500'} hover:text-[#1ed760] transition">
                    <i class="fa-solid fa-heart"></i>
                </button>
            `;

            card.addEventListener('click', () => {
                currentPlaylist = songs;
                playSong(song, card);
            });

            card.querySelector('.play-overlay').addEventListener('click', (e) => {
                e.stopPropagation();
                currentPlaylist = songs;
                playSong(song, card);
            });

            card.querySelector('.favorite-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const favBtn = e.currentTarget;
                const currentlyFav = favBtn.classList.contains('text-[#1DB954]');
                if (currentlyFav) {
                    removeFavorite(song.id);
                    favBtn.classList.replace('text-[#1DB954]', 'text-gray-500');
                    if (currentPlayingSong?.id === song.id) updatePlayerFavoriteUI(song);
                } else {
                    saveFavorite(song);
                    favBtn.classList.replace('text-gray-500', 'text-[#1DB954]');
                    if (currentPlayingSong?.id === song.id) updatePlayerFavoriteUI(song);
                }
            });

            container.appendChild(card);
        });

        // Re-attach cursor hover listeners for new cards

    }

    // =============================================
    // AUDIO PLAYER
    // =============================================
    async function playSong(song, cardElement = null) {
        if (!song) return;
        
        const statusDebug = document.getElementById('player-status-debug');
        
        if (!ytPlayerReady || !ytPlayer || typeof ytPlayer.loadVideoById !== 'function') {
            console.warn('YouTube Player not ready, attempting to wait...');
            if (statusDebug) {
                statusDebug.textContent = 'Player: Not Ready...';
                statusDebug.classList.add('text-orange-400');
            }
            // Try again in 1s if not ready
            setTimeout(() => playSong(song, cardElement), 1000);
            return;
        }

        console.log('Playing:', song.title, 'by:', song.artist);

        // Toggle same song
        if (currentPlayingSong && currentPlayingSong.id === song.id) {
            const state = ytPlayer.getPlayerState();
            if (state === YT.PlayerState.PLAYING) {
                ytPlayer.pauseVideo();
                playerPlayBtn.innerHTML = '<i class="fa-solid fa-play ml-0.5 text-lg"></i>';
                clearInterval(progressInterval);
            } else {
                ytPlayer.playVideo();
                playerPlayBtn.innerHTML = '<i class="fa-solid fa-pause text-lg"></i>';
                startProgressInterval();
            }
            return;
        }

        // Clear existing progress interval
        clearInterval(progressInterval);

        // Update UI
        miniPlayer.classList.remove('translate-y-full');
        playerImg.src = song.image || 'https://via.placeholder.com/150';
        playerTitle.textContent  = song.title  || 'Unknown Track';
        playerArtist.textContent = song.artist || 'Unknown Artist';
        playerProgress.style.width = '0%';
        playerCurrentTime.textContent = '0:00';

        // Track index
        currentIndex = currentPlaylist.findIndex(s => s.id === song.id);

        // Fetch YouTube ID & Play
        try {
            if (currentPlayingCard) currentPlayingCard.classList.remove('ring-2', 'ring-purple-500');

            // Highlight card
            if (cardElement) {
                currentPlayingCard = cardElement;
                cardElement.classList.add('ring-2', 'ring-purple-500');
            } else {
                const matchingCards = Array.from(document.querySelectorAll(`.song-card[data-song-id="${song.id}"]`));
                const visibleCard = matchingCards.find(c => c.offsetParent !== null) || matchingCards[0];
                if (visibleCard) {
                    currentPlayingCard = visibleCard;
                    currentPlayingCard.classList.add('ring-2', 'ring-purple-500');
                    currentPlayingCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            }

            // Show loading state on play button
            playerPlayBtn.innerHTML = '<div class="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin"></div>';

            const res = await fetch(`${API_BASE}/api/youtube-id?title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist)}`);
            
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Server returned ${res.status}`);
            }
            
            const data = await res.json();

            if (data.video_id) {
                console.log('Video ID found:', data.video_id);
                ytPlayer.loadVideoById(data.video_id);
                
                addToHistory(song);
                currentPlayingSong = song;
                updatePlayerFavoriteUI(song);

                // Trigger Recommendations
                const isHomePage = !pageHome.classList.contains('hidden');
                
                // Do not redraw the recommendation section if we are currently playing or skipping through it
                const isFromBecauseSection = currentPlayingCard && currentPlayingCard.closest('#because-container');
                
                if (isHomePage && !isFromBecauseSection) {
                    fetchBecauseYouLiked(song.artist, song.genre || '');
                }
            } else {
                throw new Error('No video ID found');
            }
        } catch (err) {
            console.error('Playback error:', err);
            playerPlayBtn.innerHTML = '<i class="fa-solid fa-play ml-0.5 text-lg"></i>';
            if (statusDebug) {
                statusDebug.textContent = `Error: ${err.message}`;
                statusDebug.classList.add('text-red-500');
            }
            // Fallback to preview URL if YouTube fails? 
            // For now, just let the user know.
        }
    }

    // These functions were moved to the global scope to fix the scoping bug

    function playNext() {
        if (currentPlaylist.length === 0) return;
        currentIndex = (currentIndex + 1) % currentPlaylist.length;
        playSong(currentPlaylist[currentIndex]);
    }
    window.playNext = playNext;

    function playPrevious() {
        if (currentPlaylist.length === 0) return;
        currentIndex = (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
        playSong(currentPlaylist[currentIndex]);
    }

    playerNextBtn.addEventListener('click', playNext);
    playerPrevBtn.addEventListener('click', playPrevious);

    playerPlayBtn.addEventListener('click', () => {
        if (!ytPlayer) return;
        const state = ytPlayer.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
            ytPlayer.pauseVideo();
            playerPlayBtn.innerHTML = '<i class="fa-solid fa-play ml-0.5 text-lg"></i>';
            clearInterval(progressInterval);
        } else {
            ytPlayer.playVideo();
            playerPlayBtn.innerHTML = '<i class="fa-solid fa-pause text-lg"></i>';
            startProgressInterval();
        }
    });

    playerProgressContainer.addEventListener('click', (e) => {
        if (!ytPlayer || !ytPlayer.getDuration) return;
        const rect = playerProgressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const dur = ytPlayer.getDuration();
        if (dur > 0) {
            ytPlayer.seekTo(pos * dur, true);
        }
    });

    playerCloseBtn.addEventListener('click', () => {
        ytPlayer.pauseVideo();
        clearInterval(progressInterval);
        miniPlayer.classList.add('translate-y-full');
        if (currentPlayingCard) {
            currentPlayingCard.classList.remove('ring-2', 'ring-purple-500');
            currentPlayingCard = null;
        }
    });


    // =============================================
    // VOLUME CONTROL LOGIC
    // =============================================
    let lastVolume = 80;
    let isMuted = false;

    function updateVolumeUI(value) {
        if (volumeSlider) volumeSlider.value = value;
        if (volumeProgress) volumeProgress.style.width = `${value}%`;
        
        // Update Icon
        if (!volumeIcon) return;
        volumeIcon.className = 'fa-solid';
        if (value == 0 || isMuted) {
            volumeIcon.classList.add('fa-volume-xmark');
            if (volumeProgress) volumeProgress.style.width = '0%';
        } else if (value < 30) {
            volumeIcon.classList.add('fa-volume-off');
        } else if (value < 70) {
            volumeIcon.classList.add('fa-volume-low');
        } else {
            volumeIcon.classList.add('fa-volume-high');
        }
    }

    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            if (ytPlayer && ytPlayer.setVolume) {
                ytPlayer.setVolume(val);
                if (val > 0) isMuted = false;
                updateVolumeUI(val);
            }
        });
    }

    if (volumeBtn) {
        volumeBtn.addEventListener('click', () => {
            if (!ytPlayer) return;
            
            if (isMuted) {
                ytPlayer.unMute();
                ytPlayer.setVolume(lastVolume);
                isMuted = false;
                updateVolumeUI(lastVolume);
            } else {
                lastVolume = volumeSlider ? volumeSlider.value : 80;
                ytPlayer.mute();
                isMuted = true;
                updateVolumeUI(0);
            }
        });
    }

    // Set initial volume
    setTimeout(() => {
        if (ytPlayer && ytPlayer.setVolume) {
            ytPlayer.setVolume(80);
            updateVolumeUI(80);
        }
    }, 2000);

    // =============================================
    // PLAYER FAVORITES LOGIC
    // =============================================
    function updatePlayerFavoriteUI(song) {
        if (!song || !playerFavBtn) return;
        const favs  = getFavorites();
        const isFav = favs.find(s => s.id === song.id);
        
        if (isFav) {
            playerFavBtn.classList.replace('text-gray-400', 'text-[#1DB954]');
            playerFavBtn.querySelector('i').classList.replace('fa-regular', 'fa-solid'); // in case we used regular
        } else {
            playerFavBtn.classList.replace('text-[#1DB954]', 'text-gray-400');
        }
    }

    playerFavBtn.addEventListener('click', () => {
        if (!currentPlayingSong) return;
        const favs  = getFavorites();
        const isFav = favs.find(s => s.id === currentPlayingSong.id);
        
        if (isFav) {
            removeFavorite(currentPlayingSong.id);
        } else {
            saveFavorite(currentPlayingSong);
        }
        
        updatePlayerFavoriteUI(currentPlayingSong);
        
        // Sync with visible card hearts
        const allCardFavBtns = document.querySelectorAll('.song-card .favorite-btn');
        allCardFavBtns.forEach(btn => {
            // This is a bit brute force but safe. We could optimize by checking card data, 
            // but for now, we'll just check if the parent card's song title matches.
            // Better: re-render or re-scan correctly.
            const card = btn.closest('.song-card');
            const title = card.querySelector('h4').textContent;
            if (title === currentPlayingSong.title) {
                if (isFav) btn.classList.replace('text-[#1DB954]', 'text-gray-500');
                else btn.classList.replace('text-gray-500', 'text-[#1DB954]');
            }
        });
    });


    // =============================================
    // PROFILE MODAL
    // =============================================
    const profileAvatarBtn      = document.getElementById('profile-avatar-btn');
    const profileAvatarImg      = document.getElementById('profile-avatar-img');
    const profileAvatarIcon     = document.getElementById('profile-avatar-icon');
    const profileModal          = document.getElementById('profile-modal');
    const profileModalClose     = document.getElementById('profile-modal-close');
    const profileModalBackdrop  = document.getElementById('profile-modal-backdrop');
    const profileModalAvatar    = document.getElementById('profile-modal-avatar');
    const profileModalAvatarIcon= document.getElementById('profile-modal-avatar-icon');
    const profilePhotoInput     = document.getElementById('profile-photo-input');
    const profileUsernameInput  = document.getElementById('profile-username-input');
    const profileSaveBtn        = document.getElementById('profile-save-btn');
    const profileSaveSuccess    = document.getElementById('profile-save-success');
    const profileRemovePhotoBtn = document.getElementById('profile-remove-photo-btn');

    // Tracks the currently staged photo (data URL) before saving
    let stagedPhoto = null;

    // --- Helper: show image in header avatar ---
    function setHeaderAvatar(dataUrl) {
        if (dataUrl) {
            profileAvatarImg.src = dataUrl;
            profileAvatarImg.classList.remove('hidden');
            profileAvatarIcon.classList.add('hidden');
        } else {
            profileAvatarImg.src = '';
            profileAvatarImg.classList.add('hidden');
            profileAvatarIcon.classList.remove('hidden');
        }
    }

    // --- Helper: show image in modal avatar ---
    function setModalAvatar(dataUrl) {
        if (dataUrl) {
            profileModalAvatar.src = dataUrl;
            profileModalAvatar.classList.remove('hidden');
            profileModalAvatarIcon.classList.add('hidden');
            profileRemovePhotoBtn.classList.remove('hidden');
        } else {
            profileModalAvatar.src = '';
            profileModalAvatar.classList.add('hidden');
            profileModalAvatarIcon.classList.remove('hidden');
            profileRemovePhotoBtn.classList.add('hidden');
        }
    }

    // --- Load saved profile on page load ---
    function loadProfile() {
        const savedPhoto    = localStorage.getItem('moodify_profile_photo') || null;
        const savedUsername = localStorage.getItem('moodify_profile_username') || '';

        setHeaderAvatar(savedPhoto);
        profileUsernameInput.value = savedUsername;

        // Rebuild greeting with username if saved
        if (savedUsername) {
            const greetingEl = document.getElementById('dynamic-greeting');
            if (greetingEl) {
                const hours = new Date().getHours();
                const greetText = hours < 12 ? 'Good Morning' : hours < 18 ? 'Good Afternoon' : 'Good Evening';
                const emoji     = hours < 12 ? '☀️' : hours < 18 ? '🌤️' : '👋';
                greetingEl.innerHTML = `${greetText}, ${savedUsername} <span class="text-2xl">${emoji}</span>`;
            }
        }
    }

    loadProfile();

    // Auto-enable Smart Mode if user already has data
    checkAutoSmartMode();

    // --- Open modal ---
    profileAvatarBtn.addEventListener('click', () => {
        const savedPhoto = localStorage.getItem('moodify_profile_photo') || null;
        stagedPhoto = savedPhoto; // reset staged to persisted value
        setModalAvatar(savedPhoto);
        const savedUsername = localStorage.getItem('moodify_profile_username') || '';
        profileSaveSuccess.classList.add('hidden');
        profileModal.classList.remove('hidden');
        
        // Ensure "Remove Photo" button shows if there's a staged/persisted photo
        if (stagedPhoto) profileRemovePhotoBtn.classList.remove('hidden');
        else profileRemovePhotoBtn.classList.add('hidden');

        // Re-trigger slide-in animation
        const card = profileModal.querySelector('.relative.z-10');
        card.style.animation = 'none';
        void card.offsetWidth;
        card.style.animation = '';
        setTimeout(() => profileUsernameInput.focus(), 100);
    });

    // --- Close modal ---
    function closeProfileModal() {
        profileModal.classList.add('hidden');
        stagedPhoto = null;
        profilePhotoInput.value = ''; // reset file input
    }
    profileModalClose.addEventListener('click', closeProfileModal);
    profileModalBackdrop.addEventListener('click', closeProfileModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !profileModal.classList.contains('hidden')) {
            closeProfileModal();
        }
    });

    // --- Photo upload: preview instantly in modal ---
    profilePhotoInput.addEventListener('change', () => {
        const file = profilePhotoInput.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            stagedPhoto = ev.target.result;
            setModalAvatar(stagedPhoto);
        };
        reader.readAsDataURL(file);
    });

    // --- Save profile ---
    profileSaveBtn.addEventListener('click', () => {
        const username = profileUsernameInput.value.trim();

        // Persist photo (stagedPhoto can be null if removed)
        localStorage.setItem('moodify_profile_photo', stagedPhoto || '');
        setHeaderAvatar(stagedPhoto);

        // Persist username
        localStorage.setItem('moodify_profile_username', username);

        // Update greeting
        const greetingEl = document.getElementById('dynamic-greeting');
        if (greetingEl) {
            const hours     = new Date().getHours();
            const greetText = hours < 12 ? 'Good Morning' : hours < 18 ? 'Good Afternoon' : 'Good Evening';
            const emoji     = hours < 12 ? '☀️' : hours < 18 ? '🌤️' : '👋';
            greetingEl.innerHTML = `${greetText}${username ? ', ' + username : ''} <span class="text-2xl">${emoji}</span>`;
        }

        // Success flash → auto close
        profileSaveSuccess.classList.remove('hidden');
        setTimeout(() => {
            profileSaveSuccess.classList.add('hidden');
            closeProfileModal();
        }, 1400);
    });

    // Enter key in username field triggers save
    profileUsernameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') profileSaveBtn.click();
    });

    profileRemovePhotoBtn.addEventListener('click', () => {
        stagedPhoto = null;
        setModalAvatar(null);
    });

});
