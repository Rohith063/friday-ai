/**
 * F.R.I.D.A.Y. Voice — Speech Recognition & Audio Playback
 * Uses Web Speech API for input and audio element for TTS playback.
 */

const Voice = {
    recognition: null,
    isListening: false,
    isSupported: false,
    onResult: null,      // Callback when speech is recognized
    onStart: null,       // Callback when listening starts
    onEnd: null,         // Callback when listening ends
    wakeWordEnabled: true,
    wakeWords: ['hey friday', 'friday', 'hey f.r.i.d.a.y'],

    /**
     * Initialize the voice recognition system.
     */
    init() {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported in this browser.');
            this.isSupported = false;
            return;
        }

        this.isSupported = true;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'en-US';
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        // Speech recognized
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim();
            console.log('🎤 Recognized:', transcript);

            if (this.onResult) {
                this.onResult(transcript);
            }
        };

        // Recognition started
        this.recognition.onstart = () => {
            this.isListening = true;
            if (this.onStart) this.onStart();
        };

        // Recognition ended
        this.recognition.onend = () => {
            this.isListening = false;
            if (this.onEnd) this.onEnd();
        };

        // Error handling
        this.recognition.onerror = (event) => {
            console.warn('Speech recognition error:', event.error);
            this.isListening = false;
            if (this.onEnd) this.onEnd();

            if (event.error === 'not-allowed') {
                HUD.addLogEntry('Microphone access denied', 'error');
            }
        };
    },

    /**
     * Start listening for voice input.
     */
    startListening() {
        if (!this.isSupported) {
            HUD.addLogEntry('Speech recognition not supported', 'error');
            return;
        }
        if (this.isListening) return;

        try {
            this.recognition.start();
        } catch (e) {
            console.warn('Recognition start error:', e);
        }
    },

    /**
     * Stop listening.
     */
    stopListening() {
        if (!this.isListening) return;
        try {
            this.recognition.stop();
        } catch (e) {
            console.warn('Recognition stop error:', e);
        }
    },

    /**
     * Play audio from base64-encoded MP3 data.
     * @param {string} base64Audio - Base64 encoded MP3 audio
     * @returns {Promise} - Resolves when audio finishes playing
     */
    playAudio(base64Audio) {
        return new Promise((resolve, reject) => {
            const audioPlayer = document.getElementById('audio-player');
            const blob = this.base64ToBlob(base64Audio, 'audio/mpeg');
            const url = URL.createObjectURL(blob);

            audioPlayer.src = url;

            // Start waveform visualization
            HUD.startWaveform(audioPlayer);

            audioPlayer.onended = () => {
                HUD.stopWaveform();
                URL.revokeObjectURL(url);
                resolve();
            };

            audioPlayer.onerror = (e) => {
                HUD.stopWaveform();
                URL.revokeObjectURL(url);
                reject(e);
            };

            audioPlayer.play().catch(e => {
                console.warn('Audio playback error:', e);
                HUD.stopWaveform();
                resolve(); // Don't block on audio errors
            });
        });
    },

    /**
     * Convert base64 string to Blob.
     */
    base64ToBlob(base64, mimeType) {
        const byteChars = atob(base64);
        const byteArrays = [];
        for (let offset = 0; offset < byteChars.length; offset += 1024) {
            const slice = byteChars.slice(offset, offset + 1024);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
        }
        return new Blob(byteArrays, { type: mimeType });
    }
};

// Initialize voice when DOM is ready
document.addEventListener('DOMContentLoaded', () => Voice.init());
