/**
 * F.R.I.D.A.Y. HUD — Visualizations & Effects (Online Version)
 * Canvas-based waveform, clock, and browser-available system info.
 */

const HUD = {
    canvas: null,
    ctx: null,
    animationId: null,
    audioContext: null,
    analyser: null,
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
     * Poll system status using browser APIs.
     */
    async pollSystemStatus() {
        const update = async () => {
            try {
                // CPU cores (approximate load with performance observer)
                const cores = navigator.hardwareConcurrency || 0;
                if (cores) {
                    // Simulate a CPU-like metric based on timing
                    const t0 = performance.now();
                    let sum = 0;
                    for (let i = 0; i < 100000; i++) sum += Math.random();
                    const elapsed = performance.now() - t0;
                    // Higher elapsed = busier system (rough approximation)
                    const cpuApprox = Math.min(95, Math.max(5, Math.round(elapsed * 2)));
                    document.getElementById('cpu-bar').style.width = cpuApprox + '%';
                    document.getElementById('cpu-value').textContent = cpuApprox + '%';
                    this.colorCodeStat('cpu', cpuApprox);
                }

                // RAM (Chrome only — navigator.deviceMemory)
                if (navigator.deviceMemory) {
                    const memGB = navigator.deviceMemory;
                    // We can't get real usage, but show what we know
                    const memPercent = 55; // Reasonable estimate
                    document.getElementById('ram-bar').style.width = memPercent + '%';
                    document.getElementById('ram-value').textContent = memGB + 'GB';
                    this.colorCodeStat('ram', memPercent);
                } else {
                    document.getElementById('ram-value').textContent = 'N/A';
                }

                // Storage (approximate disk usage)
                if (navigator.storage && navigator.storage.estimate) {
                    const estimate = await navigator.storage.estimate();
                    const diskPercent = Math.round((estimate.usage / estimate.quota) * 100) || 2;
                    document.getElementById('disk-bar').style.width = diskPercent + '%';
                    document.getElementById('disk-value').textContent = diskPercent + '%';
                    this.colorCodeStat('disk', diskPercent);
                } else {
                    document.getElementById('disk-value').textContent = 'N/A';
                }

                // Battery
                if (navigator.getBattery) {
                    try {
                        const battery = await navigator.getBattery();
                        const battPercent = Math.round(battery.level * 100);
                        document.getElementById('battery-bar').style.width = battPercent + '%';
                        document.getElementById('battery-value').textContent = battPercent + '%' + (battery.charging ? ' ⚡' : '');
                    } catch (e) {
                        document.getElementById('battery-value').textContent = 'N/A';
                    }
                }

                // Platform info
                document.getElementById('uptime-value').textContent = `CORES: ${cores || '?'}`;
                const platform = navigator.userAgentData?.platform || navigator.platform || 'Unknown';
                document.getElementById('platform-value').textContent = platform.substring(0, 25);

            } catch (e) {
                // Silent fail
            }
        };
        update();
        setInterval(update, 5000);
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
     * Draw idle waveform animation.
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
     * Draw active speaking waveform (simulated for browser TTS).
     */
    drawSpeakingWaveform() {
        this.isActive = true;
        cancelAnimationFrame(this.animationId);

        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width;
        const height = canvas.height;
        let phase = 0;

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            ctx.shadowBlur = 8;
            ctx.shadowColor = '#00d4ff';

            ctx.beginPath();
            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 2;

            const centerY = height / 2;
            for (let x = 0; x < width; x++) {
                const amplitude = 8 + Math.sin(phase * 0.7) * 6 + Math.random() * 4;
                const y = centerY + Math.sin((x / width) * Math.PI * 6 + phase) * amplitude
                    + Math.sin((x / width) * Math.PI * 12 + phase * 1.5) * (amplitude * 0.3);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            phase += 0.08;
            if (this.isActive) {
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
     * Start active waveform visualization.
     */
    startWaveform(audioElement) {
        // If no audio element, use simulated speaking waveform
        if (!audioElement) {
            this.drawSpeakingWaveform();
            return;
        }

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

            if (!audioElement._sourceNode) {
                const source = this.audioContext.createMediaElementSource(audioElement);
                source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                audioElement._sourceNode = source;
            }

            this.drawActiveWaveform();
        } catch (e) {
            console.warn('Waveform visualization error:', e);
            this.drawSpeakingWaveform();
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
     * Update connection status.
     */
    setConnectionStatus(connected) {
        const dot = document.getElementById('connection-status');
        const text = document.getElementById('ws-status');
        if (connected) {
            dot.classList.add('connected');
            text.textContent = 'CLIENT-SIDE';
        } else {
            dot.classList.remove('connected');
            text.textContent = 'OFFLINE';
        }
    }
};

// Initialize HUD when DOM is ready
document.addEventListener('DOMContentLoaded', () => HUD.init());
