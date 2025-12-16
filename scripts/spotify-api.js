/**
 * Spotify API Integration
 * Handles OAuth 2.0 authentication and API calls
 */

class SpotifyAPI {
    constructor() {
        // Replace with your Spotify Client ID
        // Get it from: https://developer.spotify.com/dashboard
        // Note: Only Client ID is needed for Implicit Grant flow (no Client Secret required)
        this.clientId = '323e3dad1f684c829b2063e07ad5a0f3';
        
        // Redirect URI - must match EXACTLY what's in Spotify Dashboard
        // For production: https://emotion-based-music-recommendation-theta.vercel.app/
        // The trailing slash is important - it must match your Spotify Dashboard settings exactly
        const currentOrigin = window.location.origin;
        const currentPathname = window.location.pathname;
        
        // Determine redirect URI based on current location
        if (currentOrigin.includes('vercel.app')) {
            // Production: Use exact Vercel URL with trailing slash
            this.redirectUri = 'https://emotion-based-music-recommendation-theta.vercel.app/';
        } else if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
            // Local development: Use current origin with trailing slash
            this.redirectUri = currentOrigin + '/';
        } else {
            // Fallback: Use current origin + pathname
            this.redirectUri = currentOrigin + (currentPathname === '/' ? '/' : currentPathname + (currentPathname.endsWith('/') ? '' : '/'));
        }
        
        // Debug: Log redirect URI for troubleshooting
        console.log('Initialized Spotify API with redirect URI:', this.redirectUri);
        this.scope = 'user-read-private user-read-email';
        
        // Token storage
        this.accessToken = localStorage.getItem('spotify_access_token');
        this.tokenExpiry = localStorage.getItem('spotify_token_expiry');
        
        // Emotion to search query mapping
        this.emotionQueries = {
            happy: 'upbeat pop dance party',
            sad: 'melancholic indie acoustic',
            chill: 'lo-fi hip hop ambient',
            energetic: 'high energy workout rock',
            romantic: 'romantic love ballad',
            calm: 'peaceful meditation yoga',
            angry: 'aggressive metal rock',
            nostalgic: 'vintage retro classic'
        };
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        if (!this.accessToken) return false;
        if (this.tokenExpiry && Date.now() > parseInt(this.tokenExpiry)) {
            this.logout();
            return false;
        }
        return true;
    }

    /**
     * Get authorization URL for OAuth 2.0
     */
    getAuthorizationUrl() {
        // Debug: Log the redirect URI being used
        console.log('Spotify OAuth Redirect URI:', this.redirectUri);
        console.log('Expected in Dashboard:', 'https://emotion-based-music-recommendation-theta.vercel.app/');
        
        const params = new URLSearchParams({
            client_id: this.clientId,
            response_type: 'token',
            redirect_uri: this.redirectUri,
            scope: this.scope,
            show_dialog: 'false'
        });
        
        const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
        console.log('Authorization URL:', authUrl);
        
        return authUrl;
    }
    
    /**
     * Get current redirect URI (for debugging)
     */
    getRedirectUri() {
        return this.redirectUri;
    }

    /**
     * Handle OAuth callback and extract token from URL hash
     * Returns: { success: boolean, error?: string }
     */
    handleAuthCallback() {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const expiresIn = params.get('expires_in');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        // Check for errors first
        if (error) {
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return { 
                success: false, 
                error: error,
                errorDescription: errorDescription || this.getErrorMessage(error)
            };
        }

        if (accessToken) {
            this.accessToken = accessToken;
            // Store token with expiry time (subtract 60 seconds for safety margin)
            this.tokenExpiry = Date.now() + (parseInt(expiresIn) - 60) * 1000;
            localStorage.setItem('spotify_access_token', accessToken);
            localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return { success: true };
        }
        return { success: false };
    }

    /**
     * Get user-friendly error message
     */
    getErrorMessage(error) {
        const errorMessages = {
            'unsupported_response_type': 'OAuth configuration error. Please ensure your Spotify app is configured for Implicit Grant flow and the redirect URI matches exactly.',
            'access_denied': 'Authentication was cancelled or denied.',
            'invalid_client': 'Invalid Client ID. Please check your Spotify app configuration.',
            'invalid_request': 'Invalid request. Please try again.',
            'server_error': 'Spotify server error. Please try again later.'
        };
        return errorMessages[error] || `Authentication error: ${error}`;
    }

    /**
     * Initiate authentication flow
     */
    authenticate() {
        window.location.href = this.getAuthorizationUrl();
    }

    /**
     * Logout and clear tokens
     */
    logout() {
        this.accessToken = null;
        this.tokenExpiry = null;
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_token_expiry');
    }

    /**
     * Make authenticated API request
     */
    async apiRequest(endpoint, options = {}) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated. Please connect to Spotify.');
        }

        const url = `https://api.spotify.com/v1${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (response.status === 401) {
                // Token expired
                this.logout();
                throw new Error('Session expired. Please reconnect to Spotify.');
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Spotify API Error:', error);
            throw error;
        }
    }

    /**
     * Search for tracks based on emotion
     */
    async searchByEmotion(emotion, limit = 20) {
        const query = this.emotionQueries[emotion] || emotion;
        const endpoint = `/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}&market=US`;
        
        try {
            const data = await this.apiRequest(endpoint);
            return this.formatTrackResults(data.tracks.items);
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }

    /**
     * Format track results for easier use
     */
    formatTrackResults(tracks) {
        return tracks.map(track => ({
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            album: track.album.name,
            albumArt: track.album.images[0]?.url || track.album.images[1]?.url || '',
            previewUrl: track.preview_url,
            externalUrl: track.external_urls.spotify,
            duration: track.duration_ms
        })).filter(track => track.albumArt); // Only include tracks with album art
    }

    /**
     * Get user's profile (optional, for future use)
     */
    async getUserProfile() {
        try {
            return await this.apiRequest('/me');
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    }
}

// Export for use in other scripts
window.SpotifyAPI = SpotifyAPI;

