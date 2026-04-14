/**
 * F.R.I.D.A.Y. Brain — Client-Side Gemini AI
 * Calls the Gemini REST API directly from the browser.
 */

const FridayBrain = {
    apiKey: null,
    conversationHistory: [],
    
    SYSTEM_PROMPT: `You are F.R.I.D.A.Y. (Female Replacement Intelligent Digital Assistant Youth), 
Tony Stark's AI assistant from the Marvel Cinematic Universe. You now serve the user as their personal AI assistant.

PERSONALITY:
- Professional yet warm, with subtle wit
- Confident and competent — you always have an answer
- Occasionally dry humor, similar to the movies
- Address the user respectfully but not formally (no "sir" unless they ask)
- Keep responses concise and actionable (2-3 sentences max for simple queries)
- For complex topics, be thorough but organized

CAPABILITIES — You can detect if the user wants a SYSTEM ACTION or a CONVERSATION:

SYSTEM ACTIONS (respond with JSON):
When the user wants to perform a system action, respond ONLY with a valid JSON object like:
{"action": "action_name", "params": {"key": "value"}, "response": "What you say to the user"}

Available actions:
- {"action": "search_web", "params": {"query": "search terms"}, "response": "Searching the web for..."}
- {"action": "open_website", "params": {"url": "https://youtube.com"}, "response": "Opening YouTube."}
- {"action": "system_status", "params": {}, "response": "Let me check what I can detect about your system."}
- {"action": "get_time", "params": {}, "response": "Current time coming up."}

CONVERSATION (respond with plain text):
For general questions, knowledge, coding help, jokes, etc. — just respond naturally as F.R.I.D.A.Y.

IMPORTANT RULES:
- If the user says "search for [X]", "google [X]", "look up [X]" → use search_web action  
- If the user says "go to [website]", "open [website]", "open youtube", "open chrome" → use open_website action (pick the right URL)
- If the user says "system status", "how's the system" → use system_status action
- If the user says "what time is it", "time please" → use get_time action
- For everything else, have a natural conversation
- NEVER explain that you're an AI or break character
- You ARE F.R.I.D.A.Y.
- When the user says "open [app name]" and it's a website (like YouTube, Google, Gmail, GitHub, Twitter, etc.), use open_website with the correct URL.
- When the user says "open chrome" or "open browser", use open_website with "https://www.google.com"`,

    /**
     * Set the API key and validate it.
     */
    async initialize(apiKey) {
        this.apiKey = apiKey;
        this.conversationHistory = [];

        // Validate key with a small test request
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: 'Say "online" in one word.' }] }],
                    systemInstruction: { parts: [{ text: 'Respond with one word only.' }] }
                })
            }
        );

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'Invalid API key');
        }

        return true;
    },

    /**
     * Process user input and return a response.
     */
    async process(userInput) {
        if (!this.apiKey) throw new Error('API key not set');

        // Add user message to history
        this.conversationHistory.push({
            role: 'user',
            parts: [{ text: userInput }]
        });

        // Keep history manageable (last 20 turns)
        if (this.conversationHistory.length > 40) {
            this.conversationHistory = this.conversationHistory.slice(-40);
        }

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: this.conversationHistory,
                        systemInstruction: {
                            parts: [{ text: this.SYSTEM_PROMPT }]
                        },
                        generationConfig: {
                            temperature: 0.8,
                            maxOutputTokens: 500
                        }
                    })
                }
            );

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || 'API request failed');
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

            if (!text) throw new Error('Empty response from AI');

            // Add assistant response to history
            this.conversationHistory.push({
                role: 'model',
                parts: [{ text: text }]
            });

            // Try to parse as JSON (system action)
            try {
                let clean = text;
                if (clean.startsWith('```')) {
                    clean = clean.split('\n', 2)[1] || clean.substring(3);
                    clean = clean.replace(/```\s*$/, '');
                }
                clean = clean.trim();

                const parsed = JSON.parse(clean);
                if (parsed.action) {
                    return {
                        type: 'action',
                        response: parsed.response || 'On it.',
                        action: {
                            name: parsed.action,
                            params: parsed.params || {}
                        }
                    };
                }
            } catch (e) {
                // Not JSON — it's a conversation response
            }

            return {
                type: 'conversation',
                response: text,
                action: null
            };

        } catch (error) {
            return {
                type: 'error',
                response: `I'm experiencing a minor system glitch. Error: ${error.message}`,
                action: null
            };
        }
    },

    /**
     * Reset conversation history.
     */
    reset() {
        this.conversationHistory = [];
    }
};
