/**
 * Audio Visualizer
 * Creates real-time waveform visualization using Web Audio API
 */

class AudioVisualizer {
    constructor(canvasId, audioElement) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.audio = audioElement;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.source = null;
        this.animationId = null;
        this.currentEmotion = null;
        
        // Emotion color schemes
        this.colorSchemes = {
            happy: { primary: '#f5576c', secondary: '#fee140', bg: 'rgba(250, 112, 154, 0.1)' },
            sad: { primary: '#4facfe', secondary: '#00f2fe', bg: 'rgba(79, 172, 254, 0.1)' },
            chill: { primary: '#43e97b', secondary: '#38f9d7', bg: 'rgba(67, 233, 123, 0.1)' },
            energetic: { primary: '#fa709a', secondary: '#fee140', bg: 'rgba(250, 112, 154, 0.1)' },
            romantic: { primary: '#ff9a9e', secondary: '#fecfef', bg: 'rgba(255, 154, 158, 0.1)' },
            calm: { primary: '#a8edea', secondary: '#fed6e3', bg: 'rgba(168, 237, 234, 0.1)' },
            angry: { primary: '#ff6b6b', secondary: '#ee5a6f', bg: 'rgba(255, 107, 107, 0.1)' },
            nostalgic: { primary: '#667eea', secondary: '#764ba2', bg: 'rgba(102, 126, 234, 0.1)' }
        };
        
        this.defaultColors = { primary: '#667eea', secondary: '#764ba2', bg: 'rgba(102, 126, 234, 0.1)' };
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    /**
     * Initialize Web Audio API
     */
    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            this.source = this.audioContext.createMediaElementSource(this.audio);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            return true;
        } catch (error) {
            console.error('Audio visualizer initialization error:', error);
            return false;
        }
    }

    /**
     * Set current emotion for color scheme
     */
    setEmotion(emotion) {
        this.currentEmotion = emotion;
    }

    /**
     * Get colors for current emotion
     */
    getColors() {
        return this.currentEmotion && this.colorSchemes[this.currentEmotion]
            ? this.colorSchemes[this.currentEmotion]
            : this.defaultColors;
    }

    /**
     * Start visualization
     */
    start() {
        if (!this.analyser) {
            this.init().then(() => {
                if (this.analyser) this.animate();
            });
        } else {
            this.animate();
        }
    }

    /**
     * Stop visualization
     */
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.clear();
    }

    /**
     * Clear canvas
     */
    clear() {
        const colors = this.getColors();
        this.ctx.fillStyle = colors.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Animation loop
     */
    animate() {
        if (!this.analyser || !this.dataArray) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        
        this.analyser.getByteFrequencyData(this.dataArray);
        this.draw();
    }

    /**
     * Draw visualization
     */
    draw() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const colors = this.getColors();
        
        // Clear with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, colors.bg);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);
        
        // Draw bars
        const barCount = this.dataArray.length;
        const barWidth = width / barCount * 2;
        const barSpacing = barWidth * 0.3;
        const actualBarWidth = barWidth - barSpacing;
        
        const centerY = height / 2;
        
        for (let i = 0; i < barCount; i++) {
            const barHeight = (this.dataArray[i] / 255) * height * 0.8;
            const x = i * barWidth;
            
            // Create gradient for each bar
            const barGradient = this.ctx.createLinearGradient(x, centerY - barHeight, x, centerY + barHeight);
            const progress = i / barCount;
            const currentColor = this.interpolateColor(colors.primary, colors.secondary, progress);
            barGradient.addColorStop(0, currentColor);
            barGradient.addColorStop(0.5, colors.secondary);
            barGradient.addColorStop(1, currentColor);
            
            this.ctx.fillStyle = barGradient;
            
            // Draw top bar
            this.ctx.fillRect(
                x,
                centerY - barHeight,
                actualBarWidth,
                barHeight * 0.5
            );
            
            // Draw bottom bar (mirrored)
            this.ctx.fillRect(
                x,
                centerY,
                actualBarWidth,
                barHeight * 0.5
            );
            
            // Add glow effect
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = currentColor;
            this.ctx.fillRect(
                x,
                centerY - barHeight,
                actualBarWidth,
                barHeight * 0.5
            );
            this.ctx.fillRect(
                x,
                centerY,
                actualBarWidth,
                barHeight * 0.5
            );
            this.ctx.shadowBlur = 0;
        }
    }

    /**
     * Interpolate between two hex colors
     */
    interpolateColor(color1, color2, factor) {
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
}

// Export for use in other scripts
window.AudioVisualizer = AudioVisualizer;

