document.addEventListener('DOMContentLoaded', () => {
    // =============================================
    // DOM REFERENCES
    // =============================================
    const moodCards        = document.querySelectorAll('.mood-card');
    const songsContainer   = document.getElementById('songs-container');
    const loader           = document.getElementById('loader');
    const emptyState       = document.getElementById('empty-state');
    const btnSeeAll        = document.getElementById('btn-see-all');
    const sectionTitle     = document.getElementById('section-title');
    const navFavorites     = document.getElementById('nav-favorites');
    const navHistory       = document.getElementById('nav-history');
    const navHome          = document.getElementById('nav-home');
    const navExplore       = document.getElementById('nav-explore');
    const navMovies        = document.getElementById('nav-movies');
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

    // =============================================
    // CUSTOM CURSOR LOGIC
    // =============================================
    const cursor = document.getElementById('custom-cursor');
    const aura = document.getElementById('cursor-aura');
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let auraX = 0, auraY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (cursor.style.display === 'none' || !cursor.style.display) {
            cursor.style.display = 'block';
            aura.style.display = 'block';
        }
    });

    const animateCursor = () => {
        cursorX += (mouseX - cursorX) * 0.25;
        cursorY += (mouseY - cursorY) * 0.25;
        cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;

        auraX += (mouseX - auraX) * 0.12;
        auraY += (mouseY - auraY) * 0.12;
        aura.style.transform = `translate(${auraX}px, ${auraY}px) translate(-50%, -50%)`;

        requestAnimationFrame(animateCursor);
    };
    animateCursor();

    const handleMouseEnter = () => document.body.classList.add('cursor-hover');
    const handleMouseLeave = () => document.body.classList.remove('cursor-hover');

    const refreshCursorListeners = () => {
        const interactables = document.querySelectorAll('a, button, .mood-card, .song-card, .playlist-card, .cursor-pointer, #player-progress');
        interactables.forEach(el => {
            el.removeEventListener('mouseenter', handleMouseEnter);
            el.removeEventListener('mouseleave', handleMouseLeave);
            el.addEventListener('mouseenter', handleMouseEnter);
            el.addEventListener('mouseleave', handleMouseLeave);
        });
    };
    refreshCursorListeners();

    // Hollywood Songs page
    const pageHollywood = document.getElementById('page-hollywood');
    const hwLoader      = document.getElementById('hw-loader');
    const hwResults     = document.getElementById('hw-results');
    const hwChips       = document.querySelectorAll('.hw-chip');

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
    const allPages = [pageHome, pageFavorites, pageHistory, pageExplore, pageHollywood];
    const allNavLinks = [navHome, navExplore, navMovies, navFavorites, navHistory];

    function showPage(targetPage, activeNav = null) {
        allPages.forEach(p => { if (p) p.classList.add('hidden'); });
        if (targetPage) targetPage.classList.remove('hidden');

        allNavLinks.forEach(link => {
            if (link) link.closest('li')?.classList.remove('active');
        });
        if (activeNav) activeNav.closest('li')?.classList.add('active');
    }

    // Start on home page
    showPage(pageHome, navHome);
    pageExplore.classList.add('hidden');
    pageHollywood.classList.add('hidden');

    navHome.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(pageHome, navHome);
    });

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

            if (smartModeOn) {
                fetchSmartRecommend(mood);
            } else {
                fetchSongsByMood(mood);
            }
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

    // ─── Content-Based Smart Recommend ───────────────────────────────────────
    async function fetchSmartRecommend(mood, limit = 15) {
        resetView();
        uiLoadState();
        sectionTitle.textContent = `✨ Smart Mix · ${mood.charAt(0).toUpperCase() + mood.slice(1)}`;

        const favorites = getFavorites();
        const history   = getHistory();

        try {
            const res = await fetch('http://localhost:5000/api/smart-recommend', {
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
            const res = await fetch('http://localhost:5000/api/smart-recommend', {
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
            const res  = await fetch(`http://localhost:5000/api/because-you-liked?${params}`);
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

            card.addEventListener('click', () => playSong(song, card));

            card.querySelector('.play-overlay').addEventListener('click', (e) => {
                e.stopPropagation();
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
        refreshCursorListeners();
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
            currentPlayingSong = song;
            updatePlayerFavoriteUI(song);

            // Trigger Collaborative Filtering "Because You Liked" row
            // Only on home page and only if user has listen history
            const isHomePage = !pageHome.classList.contains('hidden');
            if (isHomePage) {
                fetchBecauseYouLiked(song.artist, song.genre || '');
            }
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

    audioElement.addEventListener('timeupdate', () => {
        const cur = audioElement.currentTime;
        const dur = audioElement.duration || 30;
        const fmt = (t) => { const s = Math.floor(t); return `0:${s < 10 ? '0' : ''}${s}`; };
        playerCurrentTime.textContent = fmt(cur);
        playerProgress.style.width = `${(cur / dur) * 100}%`;
    });

    audioElement.addEventListener('ended', () => playNext());

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
