/**
 * F.R.I.D.A.Y. App — Main Application Logic
 * Handles WebSocket communication, message flow, and UI interaction.
 */

const App = {
    ws: null,
    isConnected: false,
    isBusy: false,
    messageHistory: [],
    reconnectAttempts: 0,
    maxReconnectAttempts: 10,

    /**
     * Initialize the application.
     */
    init() {
        this.connectWebSocket();
        this.bindEvents();
        this.setupVoiceCallbacks();
        HUD.addLogEntry('System initialized', 'response');
    },

    /**
     * Connect to the WebSocket server.
     */
    connectWebSocket() {
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${location.host}/ws`;

        HUD.addLogEntry('Connecting to server...', '');

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            HUD.setConnectionStatus(true);
            HUD.addLogEntry('WebSocket connected', 'response');
            HUD.setStatus('online');
        };

        this.ws.onclose = () => {
            this.isConnected = false;
            HUD.setConnectionStatus(false);
            HUD.addLogEntry('Connection lost', 'error');
            HUD.setStatus('error', 'DISCONNECTED');
            this.scheduleReconnect();
        };

        this.ws.onerror = (err) => {
            console.error('WebSocket error:', err);
            HUD.addLogEntry('Connection error', 'error');
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(JSON.parse(event.data));
        };
    },

    /**
     * Schedule a reconnection attempt.
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            HUD.addLogEntry('Max reconnect attempts reached', 'error');
            return;
        }
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        HUD.addLogEntry(`Reconnecting in ${delay / 1000}s...`, '');
        setTimeout(() => this.connectWebSocket(), delay);
    },

    /**
     * Handle incoming WebSocket messages.
     */
    async handleMessage(data) {
        switch (data.type) {
            case 'status':
                if (data.status === 'processing') {
                    HUD.setStatus('processing');
                    this.showTypingIndicator();
                } else if (data.status === 'speaking') {
                    HUD.setStatus('speaking');
                }
                break;

            case 'response':
                this.removeTypingIndicator();
                HUD.setStatus('speaking', 'RESPONDING...');

                // Add AI response to chat
                this.addMessage(data.text, 'friday');
                HUD.addLogEntry('Response received', 'response');

                // Log action if performed
                if (data.action) {
                    HUD.addLogEntry(`Action: ${data.action.name}`, 'action');
                }
                if (data.action_result) {
                    HUD.addLogEntry(data.action_result, 'action');
                }

                // Update system status if returned
                if (data.system_status) {
                    this.updateSystemStatusFromAction(data.system_status);
                }

                // Play audio response
                if (data.audio) {
                    try {
                        await Voice.playAudio(data.audio);
                    } catch (e) {
                        console.warn('Audio playback failed:', e);
                    }
                }

                HUD.setStatus('online');
                this.isBusy = false;
                break;

            case 'error':
                this.removeTypingIndicator();
                this.addMessage(data.text, 'friday');
                HUD.addLogEntry(data.text, 'error');
                HUD.setStatus('error', 'ERROR');
                setTimeout(() => HUD.setStatus('online'), 3000);
                this.isBusy = false;
                break;
        }
    },

    /**
     * Send a message to the server.
     */
    sendMessage(text) {
        if (!text.trim() || this.isBusy || !this.isConnected) return;

        this.isBusy = true;
        const startTime = Date.now();

        // Add user message to chat
        this.addMessage(text, 'user');
        HUD.addLogEntry(`User: ${text.substring(0, 40)}...`, '');
        HUD.setStatus('processing');

        // Send via WebSocket
        this.ws.send(JSON.stringify({ text: text }));

        // Track latency
        const originalHandler = this.ws.onmessage;
        const latencyHandler = (event) => {
            const latency = Date.now() - startTime;
            HUD.setLatency(latency);
            this.ws.onmessage = originalHandler;
            originalHandler(event);
        };
        this.ws.onmessage = latencyHandler;
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
        this.removeTypingIndicator(); // Prevent duplicates
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
     * Update system status display from action result.
     */
    updateSystemStatusFromAction(status) {
        if (status.cpu_percent !== undefined) {
            document.getElementById('cpu-bar').style.width = status.cpu_percent + '%';
            document.getElementById('cpu-value').textContent = status.cpu_percent + '%';
        }
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
    },

    /**
     * Bind all UI event listeners.
     */
    bindEvents() {
        // Voice button
        const voiceBtn = document.getElementById('voice-btn');
        voiceBtn.addEventListener('click', () => {
            if (this.isBusy) return;
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
            if (e.code === 'Space' && document.activeElement !== textInput) {
                e.preventDefault();
                if (!this.isBusy) {
                    Voice.startListening();
                }
            }
        });

        // Quick command buttons
        document.querySelectorAll('.quick-cmd').forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.getAttribute('data-cmd');
                if (cmd && !this.isBusy) {
                    this.sendMessage(cmd);
                }
            });
        });
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
