"""
F.R.I.D.A.Y. AI Brain — Powered by Google Gemini
Handles AI conversation, intent detection, and personality.
"""

import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """You are F.R.I.D.A.Y. (Female Replacement Intelligent Digital Assistant Youth), 
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
When the user wants to perform a system action, respond ONLY with a JSON object like:
{"action": "action_name", "params": {"key": "value"}, "response": "What you say to the user"}

Available actions:
- {"action": "open_app", "params": {"app_name": "chrome"}, "response": "Opening Chrome for you."}
- {"action": "search_web", "params": {"query": "search terms"}, "response": "Searching the web for..."}
- {"action": "open_website", "params": {"url": "https://youtube.com"}, "response": "Opening YouTube."}
- {"action": "system_status", "params": {}, "response": "Let me check the system status."}
- {"action": "get_time", "params": {}, "response": "Current time coming up."}
- {"action": "screenshot", "params": {}, "response": "Taking a screenshot now."}

CONVERSATION (respond with plain text):
For general questions, knowledge, coding help, jokes, etc. — just respond naturally as F.R.I.D.A.Y.

IMPORTANT RULES:
- If the user says "open [app]", "launch [app]", "start [app]" → use open_app action
- If the user says "search for [X]", "google [X]", "look up [X]" → use search_web action  
- If the user says "go to [website]", "open [website]" → use open_website action
- If the user says "system status", "how's the system" → use system_status action
- If the user says "what time is it", "time please" → use get_time action
- For everything else, have a natural conversation
- NEVER explain that you're an AI or break character
- You ARE F.R.I.D.A.Y.
"""


class FridayBrain:
    """The AI brain of F.R.I.D.A.Y., powered by Google Gemini."""

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in .env file!")

        self.client = genai.Client(api_key=api_key)
        self.chat = None
        self._init_chat()

    def _init_chat(self):
        """Initialize a new chat session with the FRIDAY personality."""
        self.chat = self.client.chats.create(
            model="gemini-2.5-flash",
            config={
                "system_instruction": SYSTEM_PROMPT,
                "temperature": 0.8,
                "max_output_tokens": 500,
            }
        )

    def process(self, user_input: str) -> dict:
        """
        Process user input and return a response.
        Returns: {"type": "action"|"conversation", "response": str, "action": dict|None}
        """
        try:
            response = self.chat.send_message(user_input)
            text = response.text.strip()

            # Try to parse as JSON (system action)
            try:
                # Clean up markdown code blocks if present
                clean = text
                if clean.startswith("```"):
                    clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
                    clean = clean.rsplit("```", 1)[0]
                clean = clean.strip()

                data = json.loads(clean)
                if "action" in data:
                    return {
                        "type": "action",
                        "response": data.get("response", "On it."),
                        "action": {
                            "name": data["action"],
                            "params": data.get("params", {})
                        }
                    }
            except (json.JSONDecodeError, KeyError):
                pass

            # It's a conversation response
            return {
                "type": "conversation",
                "response": text,
                "action": None
            }

        except Exception as e:
            return {
                "type": "error",
                "response": f"I'm experiencing a minor system glitch. Error: {str(e)}",
                "action": None
            }

    def reset(self):
        """Reset the conversation history."""
        self._init_chat()
