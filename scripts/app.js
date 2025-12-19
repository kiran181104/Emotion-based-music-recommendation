/**
 * Main Application Logic
 * Handles state management, UI interactions, and component coordination
 */

class MusicRecommendationApp {
    constructor() {
        // Initialize components
        this.spotifyAPI = new SpotifyAPI();
        this.audioVisualizer = new AudioVisualizer('visualizer-canvas', document.getElementById('audio-player'));
        this.emotionEffects = new EmotionEffects('emotion-canvas');
        
        // State
        this.currentEmotion = null;
        this.currentPlaylist = [];
        this.currentlyPlayingTrack = null;
        this.isPlaying = false;
        this.playlistCache = new Map();
        
        // DOM elements
        this.elements = {
            emotionGrid: document.getElementById('emotion-grid'),
            emotionCards: document.querySelectorAll('.emotion-card'),
            playlistContainer: document.getElementById('playlist-container'),
            playlistTitle: document.getElementById('playlist-title'),
            playlistLoading: document.getElementById('playlist-loading'),
            errorMessage: document.getElementById('error-message'),
            authButton: document.getElementById('auth-button'),
            authStatus: document.getElementById('auth-status'),
            visualizerSection: document.getElementById('visualizer-section'),
            audioPlayer: document.getElementById('audio-player')
        };
        
        // Initialize
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        // Handle Spotify OAuth callback (now async for PKCE flow)
        const authResult = await this.spotifyAPI.handleAuthCallback();
        if (authResult.success) {
            this.updateAuthStatus(true);
        } else {
            if (authResult.error) {
                this.showError(authResult.errorDescription || authResult.error);
            }
            this.updateAuthStatus(this.spotifyAPI.isAuthenticated());
        }
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize audio visualizer
        this.audioVisualizer.init();
        
        // Handle audio player events
        this.setupAudioPlayer();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Emotion card clicks
        this.elements.emotionCards.forEach(card => {
            card.addEventListener('click', () => {
                const emotion = card.dataset.emotion;
                this.selectEmotion(emotion);
            });
        });
        
        // Auth button
        this.elements.authButton.addEventListener('click', () => {
            if (this.spotifyAPI.isAuthenticated()) {
                this.spotifyAPI.logout();
                this.updateAuthStatus(false);
            } else {
                this.spotifyAPI.authenticate();
            }
        });
        
        // Debounce for emotion selection
        this.debouncedSelectEmotion = this.debounce((emotion) => {
            this.handleEmotionSelection(emotion);
        }, 300);
    }

    /**
     * Set up audio player event handlers
     */
    setupAudioPlayer() {
        const audio = this.elements.audioPlayer;
        
        audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.audioVisualizer.start();
            this.updateControlButtonStates();
        });
        
        audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.audioVisualizer.stop();
            this.updateControlButtonStates();
        });
        
        audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.currentlyPlayingTrack = null;
            this.audioVisualizer.stop();
            this.updateControlButtonStates();
        });
        
        audio.addEventListener('error', (e) => {
            console.error('Audio playback error:', e);
            this.showError('Unable to play this track preview.');
            this.isPlaying = false;
            this.currentlyPlayingTrack = null;
            this.updateControlButtonStates();
        });
    }

    /**
     * Select emotion and trigger playlist fetch
     */
    async selectEmotion(emotion) {
        // Update UI
        this.elements.emotionCards.forEach(card => {
            card.classList.toggle('active', card.dataset.emotion === emotion);
        });
        
        // Update background effects
        this.emotionEffects.setEmotion(emotion);
        this.currentEmotion = emotion;
        this.audioVisualizer.setEmotion(emotion);
        
        // Clear current playlist display
        this.clearPlaylist();
        
        // Show visualizer section
        this.elements.visualizerSection.classList.add('active');
        
        // Fetch playlist
        this.debouncedSelectEmotion(emotion);
    }

    /**
     * Handle emotion selection (after debounce)
     */
    async handleEmotionSelection(emotion) {
        // Check authentication
        if (!this.spotifyAPI.isAuthenticated()) {
            this.showError('Please connect to Spotify first to discover music.');
            return;
        }
        
        // Update playlist title
        this.elements.playlistTitle.textContent = `Music for ${this.capitalizeFirst(emotion)} mood`;
        
        // Show loading
        this.showLoading(true);
        this.hideError();
        
        try {
            // Check cache first
            if (this.playlistCache.has(emotion)) {
                const cachedPlaylist = this.playlistCache.get(emotion);
                this.displayPlaylist(cachedPlaylist);
                this.showLoading(false);
                return;
            }
            
            // Fetch from API
            const playlist = await this.spotifyAPI.searchByEmotion(emotion, 20);
            
            if (playlist && playlist.length > 0) {
                // Cache the playlist
                this.playlistCache.set(emotion, playlist);
                this.displayPlaylist(playlist);
            } else {
                this.showError('Unable to load songs right now. This might be due to a temporary connection issue. Please try again in a moment.');
            }
        } catch (error) {
            console.error('Error fetching playlist:', error);
            this.showError(error.message || 'Failed to fetch playlist. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Display playlist
     */
    displayPlaylist(playlist) {
        this.currentPlaylist = playlist;
        this.elements.playlistContainer.innerHTML = '';
        
        playlist.forEach((track, index) => {
            const trackElement = this.createTrackElement(track, index);
            this.elements.playlistContainer.appendChild(trackElement);
        });
    }

    /**
     * Create track element (CSP-safe, using DOM API instead of innerHTML)
     */
    createTrackElement(track, index) {
        const item = document.createElement('div');
        item.className = 'playlist-item';
        item.style.animationDelay = `${index * 0.1}s`;

        // Create album cover container
        const albumCoverContainer = document.createElement('div');
        albumCoverContainer.className = 'album-cover-container';

        // Create album cover image
        const albumCover = document.createElement('img');
        albumCover.src = track.albumArt;
        albumCover.alt = track.album;
        albumCover.className = 'album-cover';
        albumCover.loading = 'lazy';

        // Make album cover clickable to play on Spotify
        albumCover.style.cursor = 'pointer';
        albumCover.addEventListener('click', (e) => {
            e.stopPropagation();
            this.playOnSpotify(track);
        });

        albumCoverContainer.appendChild(albumCover);

        // Create Spotify play overlay
        const spotifyOverlay = document.createElement('div');
        spotifyOverlay.className = 'spotify-overlay';
        spotifyOverlay.innerHTML = '🎵 Play with Full Controls';
        spotifyOverlay.addEventListener('click', (e) => {
            e.stopPropagation();
            this.playOnSpotify(track);
        });
        albumCoverContainer.appendChild(spotifyOverlay);

        item.appendChild(albumCoverContainer);
        
        // Create track info container
        const trackInfo = document.createElement('div');
        trackInfo.className = 'track-info';
        
        // Create track name
        const trackName = document.createElement('div');
        trackName.className = 'track-name';
        trackName.title = track.name;
        trackName.textContent = track.name;
        trackInfo.appendChild(trackName);
        
        // Create artist name
        const artistName = document.createElement('div');
        artistName.className = 'artist-name';
        artistName.title = track.artist;
        artistName.textContent = track.artist;
        trackInfo.appendChild(artistName);
        
        item.appendChild(trackInfo);
        
        return item;
    }

    /**
     * Play track on Spotify using embedded player
     */
    playOnSpotify(track) {
        console.log('Playing track:', track); // Debug log

        if (!track || !track.id) {
            console.error('Invalid track object:', track);
            this.showError('Unable to play this track. Invalid track data.');
            return;
        }

        // Update currently playing track
        this.currentlyPlayingTrack = track;

        // Create or update Spotify embed
        this.showSpotifyPlayer(track);

        // Update UI to show playing state
        this.updateControlButtonStates();
    }

    /**
     * Show Spotify embedded player
     */
    showSpotifyPlayer(track) {
        const playerSection = document.getElementById('spotify-player-section');
        if (!playerSection) {
            // Create player section if it doesn't exist
            const section = document.createElement('section');
            section.id = 'spotify-player-section';
            section.className = 'spotify-player-section active';

            const container = document.createElement('div');
            container.className = 'spotify-player-container';

            // Create custom controls
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'custom-controls';

            const prevButton = document.createElement('button');
            prevButton.className = 'control-btn prev-btn';
            prevButton.innerHTML = '⏮️';
            prevButton.title = 'Previous Song';
            prevButton.addEventListener('click', () => this.playPreviousSong());

            const playPauseButton = document.createElement('button');
            playPauseButton.className = 'control-btn play-pause-btn';
            playPauseButton.innerHTML = '▶️';
            playPauseButton.title = 'Play/Pause';
            playPauseButton.addEventListener('click', () => this.togglePlayerPlayback());

            const nextButton = document.createElement('button');
            nextButton.className = 'control-btn next-btn';
            nextButton.innerHTML = '⏭️';
            nextButton.title = 'Next Song';
            nextButton.addEventListener('click', () => this.playNextSong());

            const volumeControl = document.createElement('input');
            volumeControl.type = 'range';
            volumeControl.className = 'volume-control';
            volumeControl.min = '0';
            volumeControl.max = '100';
            volumeControl.value = '50';
            volumeControl.title = 'Volume';
            volumeControl.addEventListener('input', (e) => this.setVolume(e.target.value));

            controlsDiv.appendChild(prevButton);
            controlsDiv.appendChild(playPauseButton);
            controlsDiv.appendChild(nextButton);
            controlsDiv.appendChild(volumeControl);

            const title = document.createElement('h3');
            title.className = 'spotify-player-title';
            title.textContent = `Now Playing: ${track.name} by ${track.artist}`;

            const instruction = document.createElement('p');
            instruction.className = 'spotify-instruction';
            instruction.textContent = '💡 Click the play button in the Spotify player below to start listening';

            const embedContainer = document.createElement('div');
            embedContainer.id = 'spotify-embed-container';
            embedContainer.className = 'spotify-embed-container';

            container.appendChild(controlsDiv);
            container.appendChild(title);
            container.appendChild(embedContainer);
            section.appendChild(container);

            // Insert after visualizer section
            const visualizerSection = document.getElementById('visualizer-section');
            visualizerSection.parentNode.insertBefore(section, visualizerSection.nextSibling);
        } else {
            // Update existing player
            playerSection.classList.add('active');
            const title = playerSection.querySelector('.spotify-player-title');
            title.textContent = `Now Playing: ${track.name} by ${track.artist}`;

            const instruction = playerSection.querySelector('.spotify-instruction');
            if (instruction) {
                instruction.textContent = '💡 Click the play button in the Spotify player below to start listening';
            }
        }

        // Create Spotify embed iframe
        this.createSpotifyEmbed(track);
    }

    /**
     * Create Spotify embed iframe
     */
    createSpotifyEmbed(track) {
        const embedContainer = document.getElementById('spotify-embed-container');
        if (!embedContainer) {
            console.error('Spotify embed container not found');
            return;
        }

        console.log('Creating Spotify embed for track:', track.id); // Debug log

        // Clear any existing iframe
        embedContainer.innerHTML = '';

        // Show loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'spotify-loading';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Loading Spotify player...</p>
        `;
        embedContainer.appendChild(loadingDiv);

        // Create iframe for Spotify embed
        const iframe = document.createElement('iframe');
        const embedUrl = `https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0&show_cover=true`;
        console.log('Embed URL:', embedUrl); // Debug log

        iframe.src = embedUrl;
        iframe.width = '100%';
        iframe.height = '352';
        iframe.frameBorder = '0';
        iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
        iframe.loading = 'lazy';

        // Add error handling
        iframe.onerror = function() {
            console.error('Failed to load Spotify embed for track:', track.id);
            // Show fallback link
            embedContainer.innerHTML = '';
            const fallbackDiv = document.createElement('div');
            fallbackDiv.className = 'embed-fallback';
            fallbackDiv.innerHTML = `
                <p>Unable to load Spotify player. Try opening directly:</p>
                <a href="${track.externalUrl || `https://open.spotify.com/track/${track.id}`}" target="_blank" class="spotify-fallback-link">
                    🎵 Open "${track.name}" in Spotify
                </a>
            `;
            embedContainer.appendChild(fallbackDiv);
        };

        iframe.onload = function() {
            console.log('Spotify embed loaded successfully for track:', track.id);
            // Remove loading indicator
            const loadingDiv = embedContainer.querySelector('.spotify-loading');
            if (loadingDiv) {
                loadingDiv.remove();
            }
        };

        embedContainer.appendChild(iframe);

        // Add direct link as additional option
        const directLinkDiv = document.createElement('div');
        directLinkDiv.className = 'direct-link-container';
        directLinkDiv.innerHTML = `<a href="${track.externalUrl || `https://open.spotify.com/track/${track.id}`}" target="_blank" class="spotify-direct-link">🔗 Open Full Track in Spotify Web Player</a>`;
        embedContainer.appendChild(directLinkDiv);
    }

    /**
     * Play previous song in playlist
     */
    playPreviousSong() {
        if (!this.currentlyPlayingTrack || !this.currentPlaylist.length) return;

        const currentIndex = this.currentPlaylist.findIndex(track => track.id === this.currentlyPlayingTrack.id);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : this.currentPlaylist.length - 1;
        const prevTrack = this.currentPlaylist[prevIndex];

        this.playOnSpotify(prevTrack);
    }

    /**
     * Toggle playback (this would need Spotify Web Playback SDK for full control)
     */
    togglePlayerPlayback() {
        // Note: Full play/pause control requires Spotify Web Playback SDK
        // For now, we'll refresh the embed which should restart playback
        if (this.currentlyPlayingTrack) {
            this.createSpotifyEmbed(this.currentlyPlayingTrack);
        }
    }

    /**
     * Play next song in playlist
     */
    playNextSong() {
        if (!this.currentlyPlayingTrack || !this.currentPlaylist.length) return;

        const currentIndex = this.currentPlaylist.findIndex(track => track.id === this.currentlyPlayingTrack.id);
        const nextIndex = currentIndex < this.currentPlaylist.length - 1 ? currentIndex + 1 : 0;
        const nextTrack = this.currentPlaylist[nextIndex];

        this.playOnSpotify(nextTrack);
    }

    /**
     * Set volume (limited control with embed)
     */
    setVolume(volume) {
        // Volume control is limited with iframe embeds
        // This is mostly for UI feedback
        console.log('Volume set to:', volume);
    }

    /**
     * Toggle play/pause for a track
     */
    togglePlayPause(track) {
        const audio = this.elements.audioPlayer;
        
        if (this.currentlyPlayingTrack?.id === track.id) {
            // Same track - toggle play/pause
            if (this.isPlaying) {
                audio.pause();
            } else {
                audio.play().catch(error => {
                    console.error('Playback error:', error);
                    this.showError('Unable to play track preview.');
                });
            }
        } else {
            // Different track - start playing new track
            audio.src = track.previewUrl;
            this.currentlyPlayingTrack = track;
            audio.play().catch(error => {
                console.error('Playback error:', error);
                this.showError('Unable to play track preview.');
            });
        }
        
        this.updateControlButtonStates();
    }

    /**
     * Stop a track
     */
    stopTrack(track) {
        const audio = this.elements.audioPlayer;
        
        if (this.currentlyPlayingTrack?.id === track.id) {
            audio.pause();
            audio.currentTime = 0;
            this.currentlyPlayingTrack = null;
            this.isPlaying = false;
            this.audioVisualizer.stop();
        }
        
        this.updateControlButtonStates();
    }

    /**
     * Toggle track playback (legacy function for backward compatibility)
     */
    toggleTrack(track) {
        this.togglePlayPause(track);
    }

    /**
     * Update control button states
     */
    updateControlButtonStates() {
        const items = this.elements.playlistContainer.querySelectorAll('.playlist-item');
        items.forEach(item => {
            item.classList.remove('playing', 'paused');
            const playPauseButton = item.querySelector('.play-pause-button');
            const stopButton = item.querySelector('.stop-button');
            
            if (playPauseButton) {
                playPauseButton.innerHTML = '▶️';
                playPauseButton.title = 'Play';
                playPauseButton.classList.remove('playing');
            }
            if (stopButton) {
                stopButton.disabled = true;
                stopButton.style.opacity = '0.5';
            }
        });
        
        if (this.currentlyPlayingTrack) {
            const playingItem = Array.from(items).find(item => {
                const trackName = item.querySelector('.track-name').textContent;
                return trackName === this.currentlyPlayingTrack.name;
            });
            
            if (playingItem) {
                playingItem.classList.add('playing');
                const playPauseButton = playingItem.querySelector('.play-pause-button');
                const stopButton = playingItem.querySelector('.stop-button');
                
                if (playPauseButton) {
                    if (this.isPlaying) {
                        playPauseButton.innerHTML = '⏸️';
                        playPauseButton.title = 'Pause';
                        playPauseButton.classList.add('playing');
                        playingItem.classList.add('playing');
                        playingItem.classList.remove('paused');
                    } else {
                        playPauseButton.innerHTML = '▶️';
                        playPauseButton.title = 'Resume';
                        playingItem.classList.add('paused');
                        playingItem.classList.remove('playing');
                    }
                }
                
                if (stopButton) {
                    stopButton.disabled = false;
                    stopButton.style.opacity = '1';
                }
            }
        }
    }

    /**
     * Update play button states (legacy function for backward compatibility)
     */
    updatePlayButtonStates() {
        this.updateControlButtonStates();
    }

    /**
     * Clear playlist display
     */
    clearPlaylist() {
        this.elements.playlistContainer.innerHTML = '';
        this.elements.playlistTitle.textContent = 'Select an emotion to discover music';
        this.elements.visualizerSection.classList.remove('active');
        this.elements.audioPlayer.pause();
        this.currentlyPlayingTrack = null;
        this.isPlaying = false;
        this.audioVisualizer.stop();
        this.updateControlButtonStates();

        // Hide Spotify player
        const playerSection = document.getElementById('spotify-player-section');
        if (playerSection) {
            playerSection.classList.remove('active');
        }
    }

    /**
     * Show/hide loading state
     */
    showLoading(show) {
        this.elements.playlistLoading.style.display = show ? 'flex' : 'none';
    }

    /**
     * Show error message
     */
    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.style.display = 'block';
    }

    /**
     * Hide error message
     */
    hideError() {
        this.elements.errorMessage.style.display = 'none';
    }

    /**
     * Update authentication status UI
     */
    updateAuthStatus(isAuthenticated) {
        if (isAuthenticated) {
            this.elements.authButton.textContent = 'Disconnect from Spotify';
            this.elements.authButton.classList.add('connected');
            this.elements.authStatus.textContent = 'Connected to Spotify';
            this.elements.authStatus.style.color = '#43e97b';
        } else {
            this.elements.authButton.textContent = 'Connect to Spotify';
            this.elements.authButton.classList.remove('connected');
            this.elements.authStatus.textContent = 'Connect to Spotify to discover music';
            this.elements.authStatus.style.color = '';
        }
    }

    /**
     * Debounce utility function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Capitalize first letter
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MusicRecommendationApp();
});

