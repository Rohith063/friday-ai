/**
 * F.R.I.D.A.Y. Voice — Speech Recognition & Browser TTS
 * Online version: uses Web Speech Synthesis for output instead of Edge-TTS.
 */

const Voice = {
    recognition: null,
    isListening: false,
    isSupported: false,
    isSpeaking: false,
    onResult: null,
    onStart: null,
    onEnd: null,
    onSpeakStart: null,
    onSpeakEnd: null,
    selectedVoice: null,

    /**
     * Initialize voice recognition and find best TTS voice.
     */
    init() {
        // Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.isSupported = true;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'en-US';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.trim();
                console.log('🎤 Recognized:', transcript);
                if (this.onResult) this.onResult(transcript);
            };

            this.recognition.onstart = () => {
                this.isListening = true;
                if (this.onStart) this.onStart();
            };

            this.recognition.onend = () => {
                this.isListening = false;
                if (this.onEnd) this.onEnd();
            };

            this.recognition.onerror = (event) => {
                console.warn('Speech recognition error:', event.error);
                this.isListening = false;
                if (this.onEnd) this.onEnd();
                if (event.error === 'not-allowed') {
                    HUD.addLogEntry('Microphone access denied', 'error');
                }
            };
        }

        // Find best female voice for TTS
        this.loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
    },

    /**
     * Load and select the best available female voice.
     */
    loadVoices() {
        const voices = speechSynthesis.getVoices();
        if (!voices.length) return;

        // Priority list of preferred female voices
        const preferred = [
            'Microsoft Zira',     // Windows - good female voice
            'Google UK English Female',
            'Google US English',
            'Samantha',           // macOS
            'Karen',              // macOS Australian
            'Moira',              // macOS Irish
            'Fiona',              // macOS Scottish
            'Victoria',           // macOS
            'Tessa',              // macOS South African
        ];

        // Try preferred voices first
        for (const name of preferred) {
            const match = voices.find(v => v.name.includes(name));
            if (match) {
                this.selectedVoice = match;
                console.log('🔊 Selected voice:', match.name);
                return;
            }
        }

        // Fallback: find any English female-sounding voice
        const englishVoice = voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'));
        if (englishVoice) {
            this.selectedVoice = englishVoice;
            console.log('🔊 Fallback voice:', englishVoice.name);
            return;
        }

        // Last resort: first English voice
        this.selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        console.log('🔊 Default voice:', this.selectedVoice?.name);
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

        // Stop any ongoing speech
        speechSynthesis.cancel();

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
     * Speak text using Web Speech Synthesis (browser TTS).
     * Returns a promise that resolves when speech finishes.
     */
    speak(text) {
        return new Promise((resolve) => {
            if (!('speechSynthesis' in window)) {
                resolve();
                return;
            }

            // Cancel any ongoing speech
            speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            
            if (this.selectedVoice) {
                utterance.voice = this.selectedVoice;
            }
            
            utterance.rate = 1.05;    // Slightly faster for AI feel
            utterance.pitch = 1.05;   // Slightly higher for female voice
            utterance.volume = 1.0;

            utterance.onstart = () => {
                this.isSpeaking = true;
                if (this.onSpeakStart) this.onSpeakStart();
            };

            utterance.onend = () => {
                this.isSpeaking = false;
                if (this.onSpeakEnd) this.onSpeakEnd();
                resolve();
            };

            utterance.onerror = (e) => {
                this.isSpeaking = false;
                if (this.onSpeakEnd) this.onSpeakEnd();
                console.warn('Speech synthesis error:', e);
                resolve();
            };

            // Chrome has a bug where long texts stop mid-way. 
            // Workaround: keep resuming
            const keepAlive = setInterval(() => {
                if (!this.isSpeaking) {
                    clearInterval(keepAlive);
                    return;
                }
                speechSynthesis.pause();
                speechSynthesis.resume();
            }, 10000);

            utterance.onend = () => {
                clearInterval(keepAlive);
                this.isSpeaking = false;
                if (this.onSpeakEnd) this.onSpeakEnd();
                resolve();
            };

            speechSynthesis.speak(utterance);
        });
    },

    /**
     * Play audio from base64-encoded MP3 data (kept for compatibility).
     */
    playAudio(base64Audio) {
        return new Promise((resolve, reject) => {
            const audioPlayer = document.getElementById('audio-player');
            const blob = this.base64ToBlob(base64Audio, 'audio/mpeg');
            const url = URL.createObjectURL(blob);

            audioPlayer.src = url;
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
                HUD.stopWaveform();
                resolve();
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
