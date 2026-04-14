/**
 * F.R.I.D.A.Y. App — Online Version
 * Handles API key setup, AI communication, and UI interaction.
 * Runs entirely client-side — no backend needed.
 */

const App = {
    isReady: false,
    isBusy: false,
    messageHistory: [],

    /**
     * Initialize the application.
     */
    init() {
        this.bindModalEvents();
        this.bindEvents();
        this.setupVoiceCallbacks();
        HUD.addLogEntry('System initialized (online mode)', 'response');
        HUD.setConnectionStatus(true);

        // Check for saved API key
        const savedKey = localStorage.getItem('friday_api_key');
        if (savedKey) {
            document.getElementById('api-key-input').value = savedKey;
            this.tryActivate(savedKey);
        }
    },

    /**
     * Bind API key modal events.
     */
    bindModalEvents() {
        const input = document.getElementById('api-key-input');
        const btn = document.getElementById('api-key-submit');
        const errorEl = document.getElementById('api-key-error');

        btn.addEventListener('click', async () => {
            const key = input.value.trim();
            if (!key) {
                errorEl.textContent = 'Please enter an API key.';
                return;
            }
            this.tryActivate(key);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') btn.click();
        });
    },

    /**
     * Try to activate with an API key.
     */
    async tryActivate(key) {
        const btn = document.getElementById('api-key-submit');
        const errorEl = document.getElementById('api-key-error');

        btn.disabled = true;
        btn.textContent = 'CONNECTING...';
        errorEl.textContent = '';

        try {
            await FridayBrain.initialize(key);

            // Save key if checkbox is checked
            const saveCheck = document.getElementById('save-key-check');
            if (saveCheck.checked) {
                localStorage.setItem('friday_api_key', key);
            }

            // Hide modal
            document.getElementById('api-modal').classList.add('hidden');
            this.isReady = true;

            HUD.addLogEntry('Gemini AI connected', 'response');
            HUD.setStatus('online');

        } catch (err) {
            errorEl.textContent = `Connection failed: ${err.message}`;
            btn.disabled = false;
            btn.textContent = 'INITIALIZE SYSTEM';

            // Clear saved key if it's invalid
            localStorage.removeItem('friday_api_key');
        }
    },

    /**
     * Send a message to the AI.
     */
    async sendMessage(text) {
        if (!text.trim() || this.isBusy || !this.isReady) return;

        this.isBusy = true;
        const startTime = Date.now();

        // Add user message to chat
        this.addMessage(text, 'user');
        HUD.addLogEntry(`User: ${text.substring(0, 40)}...`, '');
        HUD.setStatus('processing');
        this.showTypingIndicator();

        try {
            // Process through AI Brain
            const result = await FridayBrain.process(text);
            const latency = Date.now() - startTime;
            HUD.setLatency(latency);

            this.removeTypingIndicator();

            const responseText = result.response;

            // Execute system action if detected
            if (result.type === 'action' && result.action) {
                const actionName = result.action.name;
                const actionParams = result.action.params;
                const actionResult = await Automation.executeAction(actionName, actionParams);
                
                HUD.addLogEntry(`Action: ${actionName}`, 'action');
                HUD.addLogEntry(actionResult.substring(0, 80), 'action');
            }

            // Add AI response to chat
            this.addMessage(responseText, 'friday');
            HUD.addLogEntry('Response received', 'response');

            // Speak the response
            HUD.setStatus('speaking', 'RESPONDING...');
            HUD.startWaveform(null); // Simulated waveform

            try {
                await Voice.speak(responseText);
            } catch (e) {
                console.warn('TTS error:', e);
            }

            HUD.stopWaveform();
            HUD.setStatus('online');

        } catch (err) {
            this.removeTypingIndicator();
            this.addMessage(`System error: ${err.message}`, 'friday');
            HUD.addLogEntry(err.message, 'error');
            HUD.setStatus('error', 'ERROR');
            setTimeout(() => HUD.setStatus('online'), 3000);
        }

        this.isBusy = false;
    },

    /**
     * Add a message to the chat area.
     */
    addMessage(text, sender) {
        const chatMessages = document.getElementById('chat-messages');
        const msg = document.createElement('div');
        msg.className = `message ${sender === 'friday' ? 'friday-message' : 'user-message'}`;

        const label = sender === 'friday' ? 'F.R.I.D.A.Y.' : 'YOU';
        msg.innerHTML = `
            <span class="msg-label">${label}</span>
            <p>${this.escapeHtml(text)}</p>
        `;

        chatMessages.appendChild(msg);
        const chatArea = document.getElementById('chat-area');
        chatArea.scrollTop = chatArea.scrollHeight;

        this.messageHistory.push({ sender, text, time: new Date() });
    },

    /**
     * Show typing indicator.
     */
    showTypingIndicator() {
        this.removeTypingIndicator();
        const chatMessages = document.getElementById('chat-messages');
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(indicator);

        const chatArea = document.getElementById('chat-area');
        chatArea.scrollTop = chatArea.scrollHeight;
    },

    /**
     * Remove typing indicator.
     */
    removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    },

    /**
     * Escape HTML to prevent XSS.
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Setup voice recognition callbacks.
     */
    setupVoiceCallbacks() {
        const voiceBtn = document.getElementById('voice-btn');
        const voiceHint = document.getElementById('voice-hint');

        Voice.onResult = (transcript) => {
            this.sendMessage(transcript);
        };

        Voice.onStart = () => {
            voiceBtn.classList.add('active');
            voiceHint.textContent = 'LISTENING...';
            HUD.setStatus('listening');
            HUD.addLogEntry('Voice input active', 'action');
        };

        Voice.onEnd = () => {
            voiceBtn.classList.remove('active');
            voiceHint.textContent = 'PRESS TO SPEAK';
            if (!this.isBusy) {
                HUD.setStatus('online');
            }
        };

        Voice.onSpeakStart = () => {
            HUD.setStatus('speaking');
        };

        Voice.onSpeakEnd = () => {
            if (!this.isBusy) {
                HUD.setStatus('online');
                HUD.stopWaveform();
            }
        };
    },

    /**
     * Bind all UI event listeners.
     */
    bindEvents() {
        // Voice button
        const voiceBtn = document.getElementById('voice-btn');
        voiceBtn.addEventListener('click', () => {
            if (this.isBusy || !this.isReady) return;
            if (Voice.isListening) {
                Voice.stopListening();
            } else {
                Voice.startListening();
            }
        });

        // Text input
        const textInput = document.getElementById('text-input');
        const sendBtn = document.getElementById('send-btn');

        textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const text = textInput.value.trim();
                if (text) {
                    this.sendMessage(text);
                    textInput.value = '';
                }
            }
        });

        sendBtn.addEventListener('click', () => {
            const text = textInput.value.trim();
            if (text) {
                this.sendMessage(text);
                textInput.value = '';
            }
        });

        // Spacebar shortcut for voice
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && document.activeElement !== textInput &&
                !document.getElementById('api-key-input').matches(':focus')) {
                e.preventDefault();
                if (!this.isBusy && this.isReady) {
                    Voice.startListening();
                }
            }
        });

        // Quick command buttons
        document.querySelectorAll('.quick-cmd').forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.getAttribute('data-cmd');
                if (cmd && !this.isBusy && this.isReady) {
                    this.sendMessage(cmd);
                }
            });
        });
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
