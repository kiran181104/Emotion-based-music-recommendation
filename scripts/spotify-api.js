/**
 * Spotify API Integration
 * Handles OAuth 2.0 authentication with Authorization Code Flow + PKCE
 * Note: Implicit Grant Flow was deprecated by Spotify on Nov 27, 2025
 */

class SpotifyAPI {
    constructor() {
        // Replace with your Spotify Client ID
        // Get it from: https://developer.spotify.com/dashboard
        // Note: Using Authorization Code Flow with PKCE (Implicit Grant was deprecated Nov 27, 2025)
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
        
        // PKCE code verifier and challenge
        this.codeVerifier = this.getStoredCodeVerifier() || this.generateCodeVerifier();
        this.storeCodeVerifier(this.codeVerifier);
        
        // Token storage
        this.accessToken = localStorage.getItem('spotify_access_token');
        this.tokenExpiry = localStorage.getItem('spotify_token_expiry');
        
        // Emotion to search query mapping with language priority: Tamil, Telugu, English, Malayalam
        this.emotionQueries = {
            happy: '(tamil OR telugu OR malayalam) upbeat pop dance party',
            sad: '(tamil OR telugu OR malayalam) melancholic indie acoustic',
            chill: '(tamil OR telugu OR malayalam) lo-fi hip hop ambient',
            energetic: '(tamil OR telugu OR malayalam) high energy workout rock',
            romantic: '(tamil OR telugu OR malayalam) romantic love ballad',
            calm: '(tamil OR telugu OR malayalam) peaceful meditation yoga',
            angry: '(tamil OR telugu OR malayalam) aggressive metal rock',
            nostalgic: '(tamil OR telugu OR malayalam) vintage retro classic'
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
     * Generate PKCE code verifier
     */
    generateCodeVerifier() {
        const array = new Uint32Array(56 / 2);
        crypto.getRandomValues(array);
        return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
    }

    /**
     * Generate PKCE code challenge from verifier
     */
    async generateCodeChallenge(verifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    /**
     * Store code verifier in sessionStorage
     */
    storeCodeVerifier(verifier) {
        sessionStorage.setItem('spotify_code_verifier', verifier);
    }

    /**
     * Get stored code verifier
     */
    getStoredCodeVerifier() {
        return sessionStorage.getItem('spotify_code_verifier');
    }

    /**
     * Get authorization URL for OAuth 2.0 (Authorization Code Flow with PKCE)
     */
    async getAuthorizationUrl() {
        // Debug: Log the redirect URI being used
        console.log('Spotify OAuth Redirect URI:', this.redirectUri);
        console.log('Expected in Dashboard:', 'https://emotion-based-music-recommendation-theta.vercel.app/');
        
        // Generate code challenge from verifier
        const codeChallenge = await this.generateCodeChallenge(this.codeVerifier);
        
        const params = new URLSearchParams({
            client_id: this.clientId,
            response_type: 'code',
            redirect_uri: this.redirectUri,
            scope: this.scope,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
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
     * Handle OAuth callback and exchange authorization code for token (PKCE flow)
     * Returns: { success: boolean, error?: string }
     */
    async handleAuthCallback() {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

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

        // If we have a code, exchange it for a token
        if (code) {
            try {
                const result = await this.exchangeCodeForToken(code);
                if (result.success) {
                    // Clean up URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                    // Clear code verifier as it's no longer needed
                    sessionStorage.removeItem('spotify_code_verifier');
                    return { success: true };
                } else {
                    return result;
                }
            } catch (err) {
                console.error('Token exchange error:', err);
                window.history.replaceState({}, document.title, window.location.pathname);
                return { 
                    success: false, 
                    error: 'token_exchange_failed',
                    errorDescription: 'Failed to exchange authorization code for token. Please try again.'
                };
            }
        }
        
        return { success: false };
    }

    /**
     * Exchange authorization code for access token (PKCE flow)
     */
    async exchangeCodeForToken(code) {
        const codeVerifier = this.getStoredCodeVerifier();
        if (!codeVerifier) {
            return {
                success: false,
                error: 'missing_code_verifier',
                errorDescription: 'Code verifier not found. Please try authenticating again.'
            };
        }

        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: this.clientId,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: this.redirectUri,
                    code_verifier: codeVerifier
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Token exchange error:', errorData);
                return {
                    success: false,
                    error: errorData.error || 'token_exchange_failed',
                    errorDescription: errorData.error_description || 'Failed to exchange code for token.'
                };
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            // Store token with expiry time (subtract 60 seconds for safety margin)
            this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
            localStorage.setItem('spotify_access_token', data.access_token);
            localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());
            
            // Store refresh token if provided (for future use)
            if (data.refresh_token) {
                localStorage.setItem('spotify_refresh_token', data.refresh_token);
            }

            return { success: true };
        } catch (error) {
            console.error('Token exchange exception:', error);
            return {
                success: false,
                error: 'network_error',
                errorDescription: 'Network error during token exchange. Please check your connection and try again.'
            };
        }
    }

    /**
     * Get user-friendly error message
     */
    getErrorMessage(error) {
        const errorMessages = {
            'unsupported_response_type': 'OAuth configuration error. The app has been migrated to use Authorization Code Flow with PKCE. Please try again.',
            'access_denied': 'Authentication was cancelled or denied.',
            'invalid_client': 'Invalid Client ID. Please check your Spotify app configuration.',
            'invalid_request': 'Invalid request. Please try again.',
            'server_error': 'Spotify server error. Please try again later.',
            'token_exchange_failed': 'Failed to exchange authorization code for token. Please try again.',
            'missing_code_verifier': 'Session expired. Please try authenticating again.',
            'network_error': 'Network error. Please check your connection and try again.'
        };
        return errorMessages[error] || `Authentication error: ${error}`;
    }

    /**
     * Initiate authentication flow
     */
    async authenticate() {
        const authUrl = await this.getAuthorizationUrl();
        window.location.href = authUrl;
    }

    /**
     * Logout and clear tokens
     */
    logout() {
        this.accessToken = null;
        this.tokenExpiry = null;
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_token_expiry');
        localStorage.removeItem('spotify_refresh_token');
        sessionStorage.removeItem('spotify_code_verifier');
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
     * Search for tracks based on emotion with language priority
     * Priority: Tamil, Telugu, English, Malayalam
     */
    async searchByEmotion(emotion, limit = 20) {
        const baseQuery = this.emotionQueries[emotion] || emotion;
        // Remove language prefix from base query
        const emotionKeywords = baseQuery.replace(/\(tamil OR telugu OR malayalam\)/i, '').trim();
        
        // Try to get songs in priority languages: Tamil, Telugu, English, Malayalam
        // Split the limit across languages for better diversity
        const tracksPerLanguage = Math.ceil(limit / 4);
        const allTracks = [];
        const seenTrackIds = new Set();
        
        // Search order: Tamil, Telugu, English, Malayalam
        const languages = [
            { name: 'tamil', query: `tamil ${emotionKeywords}` },
            { name: 'telugu', query: `telugu ${emotionKeywords}` },
            { name: 'english', query: emotionKeywords },
            { name: 'malayalam', query: `malayalam ${emotionKeywords}` }
        ];
        
        try {
            // Search each language
            for (const lang of languages) {
                if (allTracks.length >= limit) break;
                
                const endpoint = `/search?q=${encodeURIComponent(lang.query)}&type=track&limit=${tracksPerLanguage}&market=IN`;
                
                try {
                    const data = await this.apiRequest(endpoint);
                    const tracks = this.formatTrackResults(data.tracks.items);
                    
                    // Add tracks that haven't been seen yet
                    for (const track of tracks) {
                        if (!seenTrackIds.has(track.id) && allTracks.length < limit) {
                            seenTrackIds.add(track.id);
                            allTracks.push(track);
                        }
                    }
                } catch (error) {
                    console.warn(`Search error for ${lang.name}:`, error);
                    // Continue with next language if one fails
                }
            }
            
            // If we don't have enough tracks, do a general search without language filter
            if (allTracks.length < limit) {
                const remainingLimit = limit - allTracks.length;
                const endpoint = `/search?q=${encodeURIComponent(emotionKeywords)}&type=track&limit=${remainingLimit * 2}&market=IN`;
                
                try {
                    const data = await this.apiRequest(endpoint);
                    const tracks = this.formatTrackResults(data.tracks.items);
                    
                    for (const track of tracks) {
                        if (!seenTrackIds.has(track.id) && allTracks.length < limit) {
                            seenTrackIds.add(track.id);
                            allTracks.push(track);
                        }
                    }
                } catch (error) {
                    console.warn('General search error:', error);
                }
            }
            
            return allTracks.slice(0, limit);
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

