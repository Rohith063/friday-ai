/**
 * F.R.I.D.A.Y. HUD — Visualizations & Effects
 * Canvas-based waveform, clock, and system status polling.
 */

const HUD = {
    canvas: null,
    ctx: null,
    animationId: null,
    audioContext: null,
    analyser: null,
    waveformData: null,
    isActive: false,

    /**
     * Initialize the HUD system.
     */
    init() {
        this.canvas = document.getElementById('waveform-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.startClock();
        this.pollSystemStatus();
        this.drawIdleWaveform();
        this.generateSessionId();
    },

    /**
     * Generate a random session ID.
     */
    generateSessionId() {
        const chars = 'ABCDEF0123456789';
        let id = '';
        for (let i = 0; i < 6; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        document.getElementById('session-id').textContent = id;
    },

    /**
     * Start the real-time clock.
     */
    startClock() {
        const update = () => {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const mins = now.getMinutes().toString().padStart(2, '0');
            const secs = now.getSeconds().toString().padStart(2, '0');
            document.getElementById('clock').textContent = `${hours}:${mins}:${secs}`;

            const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
            document.getElementById('date').textContent = now.toLocaleDateString('en-US', options).toUpperCase();
        };
        update();
        setInterval(update, 1000);
    },

    /**
     * Poll system status from the backend.
     */
    async pollSystemStatus() {
        const update = async () => {
            try {
                const res = await fetch('/api/system-status');
                if (!res.ok) return;
                const data = await res.json();

                // CPU
                document.getElementById('cpu-bar').style.width = data.cpu_percent + '%';
                document.getElementById('cpu-value').textContent = data.cpu_percent + '%';

                // RAM
                document.getElementById('ram-bar').style.width = data.memory_percent + '%';
                document.getElementById('ram-value').textContent = data.memory_percent + '%';

                // Disk
                document.getElementById('disk-bar').style.width = data.disk_percent + '%';
                document.getElementById('disk-value').textContent = data.disk_percent + '%';

                // Battery
                if (data.battery_percent !== undefined) {
                    document.getElementById('battery-bar').style.width = data.battery_percent + '%';
                    document.getElementById('battery-value').textContent = data.battery_percent + '%';
                    if (data.battery_plugged) {
                        document.getElementById('battery-value').textContent += ' ⚡';
                    }
                }

                // Uptime
                document.getElementById('uptime-value').textContent = `UPTIME: ${data.uptime_hours}h`;
                document.getElementById('platform-value').textContent = data.platform ? data.platform.substring(0, 25) : '--';

                // Color code high values
                this.colorCodeStat('cpu', data.cpu_percent);
                this.colorCodeStat('ram', data.memory_percent);
                this.colorCodeStat('disk', data.disk_percent);

            } catch (e) {
                // Silent fail — system status is non-critical
            }
        };
        update();
        setInterval(update, 5000); // Update every 5 seconds
    },

    /**
     * Color code stat bars based on value.
     */
    colorCodeStat(id, value) {
        const bar = document.getElementById(`${id}-bar`);
        if (value > 85) {
            bar.style.background = 'linear-gradient(90deg, #ff2b5e, #ff6b2b)';
        } else if (value > 65) {
            bar.style.background = 'linear-gradient(90deg, #ffd700, #ff6b2b)';
        } else {
            bar.style.background = 'linear-gradient(90deg, var(--hud-cyan), var(--hud-blue))';
        }
    },

    /**
     * Draw idle waveform animation (subtle breathing effect).
     */
    drawIdleWaveform() {
        if (this.isActive) return;
        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width;
        const height = canvas.height;
        let phase = 0;

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
            ctx.lineWidth = 1.5;

            const centerY = height / 2;
            for (let x = 0; x < width; x++) {
                const amplitude = 3 + Math.sin(phase * 0.5) * 2;
                const y = centerY + Math.sin((x / width) * Math.PI * 4 + phase) * amplitude;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Draw center line
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
            ctx.lineWidth = 0.5;
            ctx.moveTo(0, centerY);
            ctx.lineTo(width, centerY);
            ctx.stroke();

            phase += 0.03;
            if (!this.isActive) {
                this.animationId = requestAnimationFrame(draw);
            }
        };
        draw();
    },

    /**
     * Draw active waveform from audio analyser.
     */
    drawActiveWaveform() {
        if (!this.analyser) return;
        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width;
        const height = canvas.height;
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            this.analyser.getByteTimeDomainData(dataArray);
            ctx.clearRect(0, 0, width, height);

            // Glow effect
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#00d4ff';

            ctx.beginPath();
            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 2;

            const sliceWidth = width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * height) / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceWidth;
            }

            ctx.lineTo(width, height / 2);
            ctx.stroke();
            ctx.shadowBlur = 0;

            if (this.isActive) {
                this.animationId = requestAnimationFrame(draw);
            }
        };
        draw();
    },

    /**
     * Start active waveform visualization from an audio source.
     */
    startWaveform(audioElement) {
        this.isActive = true;
        cancelAnimationFrame(this.animationId);

        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            if (!this.analyser) {
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 256;
            }

            // Create source from audio element if not already connected
            if (!audioElement._sourceNode) {
                const source = this.audioContext.createMediaElementSource(audioElement);
                source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                audioElement._sourceNode = source;
            }

            this.drawActiveWaveform();
        } catch (e) {
            console.warn('Waveform visualization error:', e);
        }
    },

    /**
     * Stop active waveform and return to idle.
     */
    stopWaveform() {
        this.isActive = false;
        cancelAnimationFrame(this.animationId);
        setTimeout(() => this.drawIdleWaveform(), 100);
    },

    /**
     * Add an entry to the activity log.
     */
    addLogEntry(message, type = '') {
        const log = document.getElementById('activity-log');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;

        const now = new Date();
        const time = now.toTimeString().split(' ')[0];

        entry.innerHTML = `
            <span class="log-time">${time}</span>
            <span class="log-msg">${message}</span>
        `;

        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;

        // Keep only last 50 entries
        while (log.children.length > 50) {
            log.removeChild(log.firstChild);
        }
    },

    /**
     * Set the HUD status indicator.
     */
    setStatus(status, text) {
        const badge = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        const reactor = document.getElementById('arc-reactor');

        // Remove all status classes
        badge.className = 'status-badge';
        reactor.className = '';

        switch (status) {
            case 'online':
                statusText.textContent = text || 'SYSTEM ONLINE';
                break;
            case 'listening':
                badge.classList.add('listening');
                reactor.classList.add('listening');
                statusText.textContent = text || 'LISTENING...';
                break;
            case 'processing':
                badge.classList.add('processing');
                reactor.classList.add('processing');
                statusText.textContent = text || 'PROCESSING...';
                break;
            case 'speaking':
                badge.classList.add('speaking');
                reactor.classList.add('speaking');
                statusText.textContent = text || 'RESPONDING...';
                break;
            case 'error':
                statusText.textContent = text || 'ERROR';
                break;
        }
    },

    /**
     * Update latency display.
     */
    setLatency(ms) {
        document.getElementById('latency-value').textContent = ms + 'ms';
    },

    /**
     * Update WebSocket connection status.
     */
    setConnectionStatus(connected) {
        const dot = document.getElementById('connection-status');
        const text = document.getElementById('ws-status');
        if (connected) {
            dot.classList.add('connected');
            text.textContent = 'CONNECTED';
        } else {
            dot.classList.remove('connected');
            text.textContent = 'DISCONNECTED';
        }
    }
};

// Initialize HUD when DOM is ready
document.addEventListener('DOMContentLoaded', () => HUD.init());
