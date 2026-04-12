document.addEventListener('DOMContentLoaded', () => {
    // =============================================
    // DOM REFERENCES
    // =============================================
    const moodCards        = document.querySelectorAll('.mood-card');
    const songsContainer   = document.getElementById('songs-container');
    const loader           = document.getElementById('loader');
    const emptyState       = document.getElementById('empty-state');
    const searchInput      = document.getElementById('search-input');
    const btnSeeAll        = document.getElementById('btn-see-all');
    const sectionTitle     = document.getElementById('section-title');
    const navFavorites     = document.getElementById('nav-favorites');
    const navHistory       = document.getElementById('nav-history');
    const navExplore       = document.getElementById('nav-explore');
    const navMovies        = document.getElementById('nav-movies');
    const dynamicGreeting  = document.getElementById('dynamic-greeting');

    // Explore page
    const pageExplore         = document.getElementById('page-explore');
    const exploreSearchInput  = document.getElementById('explore-search-input');
    const exploreLoader       = document.getElementById('explore-loader');
    const exploreEmpty        = document.getElementById('explore-empty');
    const exploreResults      = document.getElementById('explore-results');
    const exploreChips        = document.querySelectorAll('.explore-chip');

    // Hollywood Songs page
    const pageHollywood = document.getElementById('page-hollywood');
    const hwLoader      = document.getElementById('hw-loader');
    const hwResults     = document.getElementById('hw-results');
    const hwChips       = document.querySelectorAll('.hw-chip');

    // Main home page wrapper
    const pageHome = document.querySelector('.p-8.max-w-7xl.mx-auto');

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
    const allPages = [pageHome, pageExplore, pageHollywood];
    const allNavLinks = [navExplore, navMovies, navFavorites, navHistory];

    function showPage(targetPage, activeNav = null) {
        allPages.forEach(p => { if (p) p.classList.add('hidden'); });
        if (targetPage) targetPage.classList.remove('hidden');

        allNavLinks.forEach(link => {
            if (link) link.closest('li')?.classList.remove('active');
        });
        if (activeNav) activeNav.closest('li')?.classList.add('active');
    }

    // Start on home page
    showPage(pageHome, navExplore);
    // Actually show home to start, mark Explore as first item that would open explore
    pageHome.classList.remove('hidden');
    pageExplore.classList.add('hidden');
    pageHollywood.classList.add('hidden');

    navExplore.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(pageExplore, navExplore);
        exploreSearchInput.focus();
    });

    navMovies.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(pageHollywood, navMovies);
        loadHollywoodSongs('top hollywood english hits');
    });

    navFavorites.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(pageHome);
        currentMood = null;
        sectionTitle.textContent = 'Your Favorites';
        btnSeeAll.textContent = 'Discover more';
        const favs = getFavorites();
        currentPlaylist = favs;
        renderSongs(favs, songsContainer);
        emptyState.classList.add('hidden');
        songsContainer.classList.remove('hidden');
    });

    navHistory.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(pageHome);
        currentMood = null;
        sectionTitle.textContent = 'Recently Played';
        btnSeeAll.textContent = 'Clear History';
        const history = getHistory();
        currentPlaylist = history;
        renderSongs(history, songsContainer);
        emptyState.classList.add('hidden');
        songsContainer.classList.remove('hidden');
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
    moodCards.forEach(card => {
        card.addEventListener('click', async () => {
            moodCards.forEach(c => {
                c.classList.remove('active-mood', c.dataset.border, c.dataset.glow, 'scale-105', 'bg-gray-700/80');
            });
            card.classList.add('active-mood', card.dataset.border, card.dataset.glow, 'scale-105', 'bg-gray-700/80');
            const mood = card.dataset.mood;
            currentMood = mood;
            sectionTitle.textContent = `${mood.charAt(0).toUpperCase() + mood.slice(1)} Hollywood Picks`;
            btnSeeAll.textContent = 'See all for this mood';
            fetchSongsByMood(mood);
        });
    });

    const playlistCards = document.querySelectorAll('.playlist-card');
    playlistCards.forEach(card => {
        card.addEventListener('click', () => {
            const mood = card.dataset.mood;
            currentMood = mood;
            sectionTitle.textContent = `${mood.charAt(0).toUpperCase() + mood.slice(1)} Hollywood Hits`;
            btnSeeAll.textContent = 'See all for this mood';
            fetchSongsByMood(mood);
            songsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });

    // Home search bar
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
            currentMood = null;
            const query = searchInput.value.trim();
            sectionTitle.textContent = `Results for "${query}"`;
            btnSeeAll.textContent = 'Search similar';
            fetchSongsBySearch(query);
        }
    });

    btnSeeAll.addEventListener('click', () => {
        if (btnSeeAll.textContent === 'Clear History') {
            localStorage.setItem('moodify_history', '[]');
            renderSongs([], songsContainer);
            return;
        }
        if (currentMood) {
            fetchSongsByMood(currentMood, 50);
            songsContainer.classList.remove('flex', 'space-x-6', 'overflow-x-auto');
            songsContainer.classList.add('grid', 'grid-cols-2', 'md:grid-cols-4', 'lg:grid-cols-5', 'gap-6', 'overflow-y-visible');
        } else {
            fetchSongsBySearch('top english hits', 40);
        }
    });

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
            const res = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(query)}&limit=30`);
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
            exploreEmpty.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-5xl mb-4 text-red-700"></i><p class="text-red-400">Search failed. Is the backend running?</p>';
            exploreEmpty.classList.remove('hidden');
        }
    }

    // =============================================
    // HOLLYWOOD SONGS PAGE
    // =============================================

    let hwCurrentQuery = '';

    async function loadHollywoodSongs(query) {
        if (query === hwCurrentQuery && hwResults.children.length > 0) return; // avoid re-fetching same
        hwCurrentQuery = query;
        hwResults.innerHTML = '';
        hwLoader.classList.remove('hidden');
        try {
            const res = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(query)}&limit=50`);
            const data = await res.json();
            hwLoader.classList.add('hidden');
            if (data.songs && data.songs.length > 0) {
                currentPlaylist = data.songs;
                renderSongs(data.songs, hwResults);
            } else {
                hwResults.innerHTML = '<div class="col-span-5 text-center py-10 text-gray-500">No songs found.</div>';
            }
        } catch (err) {
            hwLoader.classList.add('hidden');
            hwResults.innerHTML = '<div class="col-span-5 text-center py-10 text-red-400">Failed to load songs. Is the backend running?</div>';
        }
    }

    hwChips.forEach(chip => {
        chip.addEventListener('click', () => {
            hwChips.forEach(c => {
                c.classList.remove('active-chip', 'bg-purple-600/60', 'border-purple-500/50', 'text-white');
                c.classList.add('bg-gray-800/60', 'border-gray-700/50', 'text-gray-300');
            });
            chip.classList.add('active-chip', 'bg-purple-600/60', 'border-purple-500/50', 'text-white');
            chip.classList.remove('bg-gray-800/60', 'border-gray-700/50', 'text-gray-300');
            loadHollywoodSongs(chip.dataset.query);
        });
    });

    // =============================================
    // API FETCHERS (for Home page)
    // =============================================
    async function fetchSongsByMood(mood, limit = 15) {
        resetView();
        uiLoadState();
        try {
            const res = await fetch(`http://localhost:5000/api/recommend?mood=${mood}&limit=${limit}`);
            if (!res.ok) throw new Error('API Failed');
            const data = await res.json();
            handleSongsResponse(data);
        } catch (err) {
            console.error(err);
            showError('Failed to fetch songs. Is the backend running?');
        }
    }

    async function fetchSongsBySearch(query, limit = 15) {
        resetView();
        uiLoadState();
        try {
            const res = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
            if (!res.ok) throw new Error('API Failed');
            const data = await res.json();
            handleSongsResponse(data);
        } catch (err) {
            console.error(err);
            showError('Search failed.');
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
    // =============================================
    function renderSongs(songs, container) {
        container.innerHTML = '';
        const favorites = getFavorites();

        songs.forEach((song) => {
            if (!song.preview_url) return;
            const isFav = favorites.find(s => s.id === song.id);

            const card = document.createElement('div');
            card.className = 'song-card flex-shrink-0 bg-gray-800/40 rounded-xl p-3 hover:bg-gray-700/50 transition-all cursor-pointer group relative';
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

            card.addEventListener('click', () => playSong(song, card));

            card.querySelector('.play-overlay').addEventListener('click', (e) => {
                e.stopPropagation();
                playSong(song, card);
            });

            card.querySelector('.favorite-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const favBtn = e.currentTarget;
                const currentlyFav = favBtn.classList.contains('text-pink-500');
                if (currentlyFav) {
                    removeFavorite(song.id);
                    favBtn.classList.replace('text-pink-500', 'text-gray-500');
                } else {
                    saveFavorite(song);
                    favBtn.classList.replace('text-gray-500', 'text-pink-500');
                }
            });

            container.appendChild(card);
        });
    }

    // =============================================
    // AUDIO PLAYER
    // =============================================
    async function playSong(song, cardElement = null) {
        if (!song) return;
        console.log('Playing:', song.title, 'by:', song.artist);

        // Toggle same song
        if (audioElement.src === song.preview_url) {
            if (audioElement.paused) {
                try {
                    await audioElement.play();
                    playerPlayBtn.innerHTML = '<i class="fa-solid fa-pause text-lg"></i>';
                } catch (e) { console.error('Resume failed:', e); }
            } else {
                audioElement.pause();
                playerPlayBtn.innerHTML = '<i class="fa-solid fa-play ml-0.5 text-lg"></i>';
            }
            return;
        }

        // Clear state
        try {
            audioElement.pause();
            audioElement.currentTime = 0;
            if (currentPlayingCard) currentPlayingCard.classList.remove('ring-2', 'ring-purple-500');
        } catch (e) {}

        // Update UI
        miniPlayer.classList.remove('translate-y-full');
        playerImg.src = song.image || 'https://via.placeholder.com/150';
        playerTitle.textContent  = song.title  || 'Unknown Track';
        playerArtist.textContent = song.artist || 'Unknown Artist';
        playerProgress.style.width = '0%';
        playerCurrentTime.textContent = '0:00';

        // Track index
        currentIndex = currentPlaylist.findIndex(s => s.id === song.id);

        // Highlight card
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

        // Load & play
        try {
            audioElement.src = song.preview_url;

            await new Promise((resolve) => {
                const onReady = () => { audioElement.removeEventListener('loadedmetadata', onReady); resolve(); };
                audioElement.addEventListener('loadedmetadata', onReady);
                setTimeout(resolve, 1000); // safety fallback
            });

            await audioElement.play();
            playerPlayBtn.innerHTML = '<i class="fa-solid fa-pause text-lg"></i>';
            addToHistory(song);
        } catch (err) {
            console.error('Playback error:', err);
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

    playerPlayBtn.addEventListener('click', () => {
        if (audioElement.paused) {
            audioElement.play();
            playerPlayBtn.innerHTML = '<i class="fa-solid fa-pause text-lg"></i>';
        } else {
            audioElement.pause();
            playerPlayBtn.innerHTML = '<i class="fa-solid fa-play ml-0.5 text-lg"></i>';
        }
    });

    playerCloseBtn.addEventListener('click', () => {
        audioElement.pause();
        miniPlayer.classList.add('translate-y-full');
        if (currentPlayingCard) {
            currentPlayingCard.classList.remove('ring-2', 'ring-purple-500');
            currentPlayingCard = null;
        }
    });

    audioElement.addEventListener('timeupdate', () => {
        const cur = audioElement.currentTime;
        const dur = audioElement.duration || 30;
        const fmt = (t) => { const s = Math.floor(t); return `0:${s < 10 ? '0' : ''}${s}`; };
        playerCurrentTime.textContent = fmt(cur);
        playerProgress.style.width = `${(cur / dur) * 100}%`;
    });

    audioElement.addEventListener('ended', () => playNext());
});
