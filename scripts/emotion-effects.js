/**
 * Emotion-Specific Background Effects
 * Creates canvas-based animations for each emotion
 */

class EmotionEffects {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.currentEmotion = null;
        this.animationId = null;
        this.particles = [];
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * Set current emotion and start animation
     */
    setEmotion(emotion) {
        if (this.currentEmotion === emotion) return;
        
        this.stop();
        this.currentEmotion = emotion;
        this.particles = [];
        
        switch(emotion) {
            case 'happy':
                this.initHappyEffect();
                break;
            case 'sad':
                this.initSadEffect();
                break;
            case 'chill':
                this.initChillEffect();
                break;
            case 'energetic':
                this.initEnergeticEffect();
                break;
            case 'romantic':
                this.initRomanticEffect();
                break;
            case 'calm':
                this.initCalmEffect();
                break;
            case 'angry':
                this.initAngryEffect();
                break;
            case 'motivation':
                this.initMotivationEffect();
                break;
            default:
                return;
        }
        
        this.animate();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.clear();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    animate() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    update() {
        // Override in specific emotion effects
    }

    draw() {
        // Override in specific emotion effects
    }

    // ========== HAPPY: Bouncing Confetti ==========
    initHappyEffect() {
        const colors = ['#f093fb', '#f5576c', '#fee140', '#fa709a'];
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: -Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 2 + 1,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1
            });
        }
    }

    updateHappyEffect() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // gravity
            p.rotation += p.rotationSpeed;
            
            if (p.y > this.canvas.height) {
                p.y = -10;
                p.x = Math.random() * this.canvas.width;
                p.vy = Math.random() * 2 + 1;
            }
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
        });
    }

    drawHappyEffect() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
            this.ctx.restore();
        });
    }

    // ========== SAD: Gentle Rainfall ==========
    initSadEffect() {
        for (let i = 0; i < 100; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                length: Math.random() * 20 + 10,
                speed: Math.random() * 5 + 2,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }

    updateSadEffect() {
        this.particles.forEach(p => {
            p.y += p.speed;
            if (p.y > this.canvas.height) {
                p.y = -p.length;
                p.x = Math.random() * this.canvas.width;
            }
        });
    }

    drawSadEffect() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = 'rgba(79, 172, 254, 0.5)';
        this.ctx.lineWidth = 2;
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.opacity;
            this.ctx.beginPath();
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(p.x, p.y + p.length);
            this.ctx.stroke();
        });
        this.ctx.globalAlpha = 1;
    }

    // ========== CHILL: Floating Bubbles ==========
    initChillEffect() {
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height + Math.random() * 100,
                size: Math.random() * 30 + 10,
                speed: Math.random() * 0.5 + 0.2,
                opacity: Math.random() * 0.3 + 0.1
            });
        }
    }

    updateChillEffect() {
        this.particles.forEach(p => {
            p.y -= p.speed;
            p.x += Math.sin(p.y * 0.01) * 0.5;
            if (p.y < -p.size) {
                p.y = this.canvas.height + p.size;
                p.x = Math.random() * this.canvas.width;
            }
        });
    }

    drawChillEffect() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(67, 233, 123, ${p.opacity})`;
            this.ctx.fill();
            this.ctx.strokeStyle = `rgba(67, 233, 123, ${p.opacity * 0.5})`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        });
    }

    // ========== ENERGETIC: Neon Pulse ==========
    initEnergeticEffect() {
        // Create pulsing circles
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                baseSize: Math.random() * 100 + 50,
                size: 0,
                maxSize: Math.random() * 200 + 150,
                speed: Math.random() * 0.05 + 0.02,
                opacity: 0,
                color: Math.random() > 0.5 ? '#fa709a' : '#fee140'
            });
        }
    }

    updateEnergeticEffect() {
        this.particles.forEach(p => {
            p.size += p.speed * (p.maxSize - p.size);
            p.opacity = Math.sin((p.size / p.maxSize) * Math.PI) * 0.3;
            if (p.size >= p.maxSize * 0.95) {
                p.size = 0;
                p.x = Math.random() * this.canvas.width;
                p.y = Math.random() * this.canvas.height;
            }
        });
    }

    drawEnergeticEffect() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color.replace(')', `, ${p.opacity})`).replace('rgb', 'rgba');
            this.ctx.fill();
        });
    }

    // ========== ROMANTIC: Floating Hearts ==========
    initRomanticEffect() {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height + Math.random() * 100,
                size: Math.random() * 15 + 8,
                speed: Math.random() * 1 + 0.5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.05,
                opacity: Math.random() * 0.5 + 0.3
            });
        }
    }

    updateRomanticEffect() {
        this.particles.forEach(p => {
            p.y -= p.speed;
            p.rotation += p.rotationSpeed;
            if (p.y < -p.size * 2) {
                p.y = this.canvas.height + p.size;
                p.x = Math.random() * this.canvas.width;
            }
        });
    }

    drawRomanticEffect() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach(p => {
            this.drawHeart(p.x, p.y, p.size, p.rotation, `rgba(255, 154, 158, ${p.opacity})`);
        });
    }

    drawHeart(x, y, size, rotation, color) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(0, size * 0.3);
        this.ctx.bezierCurveTo(-size * 0.5, -size * 0.2, -size, size * 0.3, 0, size);
        this.ctx.bezierCurveTo(size, size * 0.3, size * 0.5, -size * 0.2, 0, size * 0.3);
        this.ctx.fill();
        this.ctx.restore();
    }

    // ========== CALM: Soft Glow Waves ==========
    initCalmEffect() {
        this.particles = [{ time: 0 }];
    }

    updateCalmEffect() {
        this.particles[0].time += 0.02;
    }

    drawCalmEffect() {
        this.clear();
        const time = this.particles[0].time;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, `rgba(168, 237, 234, ${0.1 + Math.sin(time) * 0.05})`);
        gradient.addColorStop(1, `rgba(254, 214, 227, ${0.1 + Math.cos(time) * 0.05})`);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // ========== ANGRY: Scattered Particles ==========
    initAngryEffect() {
        for (let i = 0; i < 80; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: Math.random() * 4 + 2,
                color: '#ff6b6b',
                life: Math.random() * 100
            });
        }
    }

    updateAngryEffect() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
            if (p.life <= 0) {
                p.x = Math.random() * this.canvas.width;
                p.y = Math.random() * this.canvas.height;
                p.life = 100;
            }
        });
    }

    drawAngryEffect() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    // ========== MOTIVATION: Rising Energy Particles ==========
    initMotivationEffect() {
        for (let i = 0; i < 40; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height + Math.random() * 100,
                size: Math.random() * 4 + 2,
                speedY: -(Math.random() * 2 + 1),
                speedX: (Math.random() - 0.5) * 0.5,
                life: Math.random() * 100 + 50,
                maxLife: Math.random() * 100 + 50,
                color: Math.random() > 0.5 ? '#ff6b35' : '#f7931e'
            });
        }
    }

    updateMotivationEffect() {
        this.particles.forEach((p, index) => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.life--;

            // Reset particle when it goes off screen or dies
            if (p.y < -10 || p.life <= 0) {
                p.x = Math.random() * this.canvas.width;
                p.y = this.canvas.height + Math.random() * 50;
                p.life = p.maxLife;
                p.speedY = -(Math.random() * 2 + 1);
                p.speedX = (Math.random() - 0.5) * 0.5;
            }
        });
    }

    drawMotivationEffect() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach(p => {
            const opacity = p.life / p.maxLife;
            this.ctx.fillStyle = p.color.replace(')', `, ${opacity * 0.8})`).replace('rgb', 'rgba');
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Add glow effect
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }

    // ========== Update and Draw Methods ==========
    update() {
        switch(this.currentEmotion) {
            case 'happy': this.updateHappyEffect(); break;
            case 'sad': this.updateSadEffect(); break;
            case 'chill': this.updateChillEffect(); break;
            case 'energetic': this.updateEnergeticEffect(); break;
            case 'romantic': this.updateRomanticEffect(); break;
            case 'calm': this.updateCalmEffect(); break;
            case 'angry': this.updateAngryEffect(); break;
            case 'motivation': this.updateMotivationEffect(); break;
        }
    }

    draw() {
        switch(this.currentEmotion) {
            case 'happy': this.drawHappyEffect(); break;
            case 'sad': this.drawSadEffect(); break;
            case 'chill': this.drawChillEffect(); break;
            case 'energetic': this.drawEnergeticEffect(); break;
            case 'romantic': this.drawRomanticEffect(); break;
            case 'calm': this.drawCalmEffect(); break;
            case 'angry': this.drawAngryEffect(); break;
            case 'motivation': this.drawMotivationEffect(); break;
        }
    }
}

// Export for use in other scripts
window.EmotionEffects = EmotionEffects;

