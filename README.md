# 🎵 Emotion-Based Music Recommendation UI

A visually rich, interactive web application that recommends music based on your current mood or emotion. Features smooth animations, beautiful UI design, and integration with Spotify Web API.

## ✨ Features

- **8 Emotion Categories**: Happy, Sad, Chill, Energetic, Romantic, Calm, Angry, and Nostalgic
- **Spotify Integration**: Real music recommendations powered by Spotify Web API
- **Audio Visualizer**: Real-time waveform visualization with emotion-specific color schemes
- **Animated Background Effects**: Unique canvas-based animations for each emotion
- **Modern UI Design**: Mix of glassmorphism, neumorphism, and gradient styles
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Smooth Animations**: Hover effects, transitions, and micro-interactions

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A Spotify Developer Account (free)

### Spotify API Setup

1. **Create a Spotify Developer Account**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Log in with your Spotify account

2. **Create a New App**
   - Click "Create an app"
   - Fill in the app details:
     - App name: "Emotion-Based Music Recommendation" (or any name)
     - App description: "Music recommendation based on emotions"
     - Redirect URI: `http://localhost` (or your domain)
     - Category: Website
   - Check the terms and click "Save"

3. **Get Your Credentials**
   - Once created, you'll see your app dashboard
   - Copy your **Client ID**
   - Note: For web apps using Implicit Grant flow, you don't need the Client Secret

4. **Configure the App**
   - Open `scripts/spotify-api.js`
   - Replace `YOUR_SPOTIFY_CLIENT_ID` with your actual Client ID:
     ```javascript
     this.clientId = 'your-actual-client-id-here';
     ```

5. **Update Redirect URI**
   - In Spotify Dashboard, go to "Edit Settings"
   - Add your redirect URI (e.g., `http://localhost`, `http://localhost:8000`, or your production URL)
   - Update the `redirectUri` in `spotify-api.js` to match:
     ```javascript
     this.redirectUri = window.location.origin + window.location.pathname;
     ```
     This automatically uses your current URL, but make sure it matches what you set in Spotify Dashboard.

### Running the Application

1. **Clone or Download**
   ```bash
   cd "E:\GITHUB PROJECTS\Emotion based"
   ```

2. **Serve the Files**
   
   **Option 1: Using Python (if installed)**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Option 2: Using Node.js (if installed)**
   ```bash
   npx http-server -p 8000
   ```

   **Option 3: Using VS Code Live Server**
   - Install "Live Server" extension
   - Right-click on `index.html` and select "Open with Live Server"

   **Option 4: Direct File Opening**
   - Simply double-click `index.html` (some features may be limited)

3. **Open in Browser**
   - Navigate to `http://localhost:8000` (or the port you used)
   - Click "Connect to Spotify" and authorize the app
   - Start selecting emotions and discovering music!

## 📁 Project Structure

```
emotion-based-music/
├── index.html              # Main HTML structure
├── styles/
│   ├── main.css           # Core styles (glassmorphism, neumorphism, gradients)
│   ├── animations.css     # Keyframe animations
│   └── responsive.css     # Mobile-responsive styles
├── scripts/
│   ├── app.js             # Main application logic
│   ├── spotify-api.js     # Spotify API integration
│   ├── visualizer.js      # Audio waveform visualization
│   └── emotion-effects.js # Emotion-specific background effects
├── assets/
│   └── images/            # Static assets (if needed)
└── README.md              # This file
```

## 🎨 Design Features

### Glassmorphism
- Emotion selector cards with frosted glass effect
- Playlist container with backdrop blur

### Neumorphism
- Playlist item cards with soft shadows
- Play buttons with embossed effects
- Auth button with subtle depth

### Gradients
- Emotion-specific color schemes
- Background gradients
- Button hover effects

## 🎭 Emotion Effects

Each emotion triggers unique background animations:

- **Happy**: Bouncing confetti particles
- **Sad**: Gentle rainfall effect
- **Chill**: Floating bubbles
- **Energetic**: Neon pulse waves
- **Romantic**: Floating hearts
- **Calm**: Soft glow waves
- **Angry**: Scattered particles
- **Nostalgic**: Twinkling stars

## 🎵 How It Works

1. **Connect to Spotify**: Click "Connect to Spotify" and authorize the app
2. **Select an Emotion**: Choose from 8 emotion categories
3. **View Playlist**: See recommended tracks based on your selected emotion
4. **Play Music**: Click on a track to play a 30-second preview
5. **Enjoy Visualizations**: Watch the audio visualizer sync with the music

## 🔧 Customization

### Adding New Emotions

1. Add a new emotion card in `index.html`:
   ```html
   <div class="emotion-card" data-emotion="excited">
       <div class="emotion-emoji">🎉</div>
       <div class="emotion-label">Excited</div>
   </div>
   ```

2. Add emotion query mapping in `scripts/spotify-api.js`:
   ```javascript
   excited: 'energetic upbeat celebration'
   ```

3. Add color scheme in `styles/main.css` and `scripts/visualizer.js`

4. Add background effect in `scripts/emotion-effects.js`

### Modifying Color Schemes

Edit the CSS variables in `styles/main.css`:
```css
:root {
    --color-your-emotion: linear-gradient(135deg, #color1 0%, #color2 100%);
}
```

## 🐛 Troubleshooting

### "Not authenticated" Error
- Make sure you've clicked "Connect to Spotify"
- Check that your Client ID is correctly set in `spotify-api.js`
- Verify the redirect URI matches in Spotify Dashboard

### "unsupported_response_type" Error
This error occurs when the Spotify app configuration doesn't match. To fix:

1. **Go to Spotify Dashboard**: https://developer.spotify.com/dashboard
2. **Click on your app** → **Settings**
3. **Check Redirect URIs**: 
   - For local development: Add `http://localhost` or `http://localhost:8000`
   - For Vercel deployment: Add your exact Vercel URL (e.g., `https://emotion-based-music-recommendation-theta.vercel.app`)
   - **Important**: The URI must match EXACTLY (including trailing slash or lack thereof)
4. **Save changes**
5. **Try authenticating again**

**Note**: Make sure you're using Implicit Grant flow (response_type=token), not Authorization Code flow.

### Audio Not Playing
- Some tracks don't have preview URLs available
- Check browser console for errors
- Ensure Web Audio API is supported in your browser

### Visualizer Not Showing
- Make sure a track is playing
- Check browser console for Web Audio API errors
- Some browsers require user interaction before allowing audio

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📝 Notes

- This app uses Spotify's **Implicit Grant Flow** for authentication
- Only 30-second previews are available (full tracks require Premium)
- Some tracks may not have preview URLs available
- The app requires an active internet connection

## 🎯 Future Enhancements

- Dark/Light mode toggle
- Save favorite playlists
- Auto-detect emotion from webcam (ML API)
- Full audio player controls
- Share playlists functionality
- Lyrics display
- Volume control

## 📄 License

This project is open source and available for personal and educational use.

## 🙏 Credits

- Spotify Web API for music data
- Modern CSS techniques (glassmorphism, neumorphism)
- Web Audio API for visualization

---

Enjoy discovering music based on your emotions! 🎵✨

