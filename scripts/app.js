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
    init() {
        // Handle Spotify OAuth callback
        const authResult = this.spotifyAPI.handleAuthCallback();
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
            this.updatePlayButtonStates();
        });
        
        audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.audioVisualizer.stop();
            this.updatePlayButtonStates();
        });
        
        audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.currentlyPlayingTrack = null;
            this.audioVisualizer.stop();
            this.updatePlayButtonStates();
        });
        
        audio.addEventListener('error', (e) => {
            console.error('Audio playback error:', e);
            this.showError('Unable to play this track preview.');
            this.isPlaying = false;
            this.currentlyPlayingTrack = null;
            this.updatePlayButtonStates();
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
                this.showError('No tracks found for this emotion. Please try another one.');
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
        
        const hasPreview = !!track.previewUrl;
        
        // Create album cover container
        const albumCoverContainer = document.createElement('div');
        albumCoverContainer.className = 'album-cover-container';
        
        // Create album cover image
        const albumCover = document.createElement('img');
        albumCover.src = track.albumArt;
        albumCover.alt = track.album;
        albumCover.className = 'album-cover';
        albumCover.loading = 'lazy';
        albumCoverContainer.appendChild(albumCover);
        
        // Create play button overlay if preview is available
        if (hasPreview) {
            const playButtonOverlay = document.createElement('div');
            playButtonOverlay.className = 'play-button-overlay';
            
            const playIcon = document.createElement('div');
            playIcon.className = 'play-icon';
            playButtonOverlay.appendChild(playIcon);
            
            playButtonOverlay.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTrack(track);
            });
            
            albumCoverContainer.appendChild(playButtonOverlay);
        }
        
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
        
        if (!hasPreview) {
            item.style.opacity = '0.6';
            item.title = 'Preview not available';
        }
        
        return item;
    }

    /**
     * Toggle track playback
     */
    toggleTrack(track) {
        const audio = this.elements.audioPlayer;
        
        if (this.currentlyPlayingTrack?.id === track.id && this.isPlaying) {
            // Pause current track
            audio.pause();
            this.currentlyPlayingTrack = null;
        } else {
            // Play new track or resume
            if (this.currentlyPlayingTrack?.id !== track.id) {
                audio.src = track.previewUrl;
                this.currentlyPlayingTrack = track;
            }
            audio.play().catch(error => {
                console.error('Playback error:', error);
                this.showError('Unable to play track preview.');
            });
        }
        
        this.updatePlayButtonStates();
    }

    /**
     * Update play button states
     */
    updatePlayButtonStates() {
        const items = this.elements.playlistContainer.querySelectorAll('.playlist-item');
        items.forEach(item => {
            item.classList.remove('playing');
        });
        
        if (this.currentlyPlayingTrack && this.isPlaying) {
            const playingItem = Array.from(items).find(item => {
                const trackName = item.querySelector('.track-name').textContent;
                return trackName === this.currentlyPlayingTrack.name;
            });
            if (playingItem) {
                playingItem.classList.add('playing');
                const playIcon = playingItem.querySelector('.play-icon');
                if (playIcon) {
                    playIcon.classList.add('paused');
                }
            }
        } else {
            // Update all play icons to show play state
            items.forEach(item => {
                const playIcon = item.querySelector('.play-icon');
                if (playIcon) {
                    playIcon.classList.remove('paused');
                }
            });
        }
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

