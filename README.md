<p align="center">
  <img src="https://img.shields.io/badge/STATUS-ONLINE-00d4ff?style=for-the-badge&labelColor=050510" />
  <img src="https://img.shields.io/badge/AI-GEMINI%202.5-0088ff?style=for-the-badge&labelColor=050510" />
  <img src="https://img.shields.io/badge/VOICE-ARIA%20NEURAL-00ff88?style=for-the-badge&labelColor=050510" />
</p>

<h1 align="center">
  🔵 F.R.I.D.A.Y.
</h1>

<p align="center">
  <strong>Female Replacement Intelligent Digital Assistant Youth</strong><br>
  <em>Your personal Iron Man-style AI assistant — powered by Google Gemini & Edge-TTS</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.10+-blue?logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-WebSocket-009688?logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Edge--TTS-Neural%20Voice-purple?logo=microsoft&logoColor=white" />
</p>

---

## ⚡ What is F.R.I.D.A.Y.?

A fully functional, voice-controlled AI assistant with an **Iron Man HUD-style interface**. Talk to her, type commands, or use quick shortcuts — F.R.I.D.A.Y. can:

- 💬 **Have natural conversations** — powered by Google Gemini 2.5
- 🎤 **Understand voice commands** — using Web Speech API
- 🔊 **Speak back to you** — with Microsoft's Aria Neural voice (Edge-TTS)
- 🖥️ **Control your system** — open apps, search the web, take screenshots
- 📊 **Monitor system health** — real-time CPU, RAM, disk, and battery stats
- ⏱️ **Show time & session info** — full HUD with latency tracking

---

## 🎨 Interface Preview

The holographic HUD features:
- **Arc Reactor** — animated spinning rings that change color based on state (listening → gold, processing → orange, speaking → green)
- **System Diagnostics** — live CPU, RAM, Disk, Battery bars with color-coded alerts
- **Chat Area** — full conversation history with typing indicators
- **Waveform Visualizer** — real-time audio waveform when F.R.I.D.A.Y. speaks
- **Activity Log** — timestamped log of every action
- **Quick Commands** — one-click shortcuts for common tasks

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+** — [Download](https://www.python.org/downloads/)
- **Google Gemini API Key** (free) — [Get yours here](https://aistudio.google.com/apikey)
- **Modern browser** — Chrome/Edge recommended (for voice input support)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/friday-ai.git
   cd friday-ai
   ```

2. **Add your API key**
   ```bash
   cp backend/.env.example backend/.env
   ```
   Open `backend/.env` and paste your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_key_here
   ```

3. **Install dependencies**
   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Run F.R.I.D.A.Y.**
   ```bash
   cd backend
   python main.py
   ```

5. **Open the HUD** → [http://localhost:8000](http://localhost:8000)

### 🪟 Windows One-Click Launch

Just double-click **`start.bat`** — it handles everything automatically!

---

## 🗂️ Project Structure

```
friday-ai/
├── backend/
│   ├── main.py              # FastAPI + WebSocket server
│   ├── ai_brain.py          # Gemini AI integration & personality
│   ├── automation.py        # System control (apps, web, screenshots)
│   ├── voice.py             # Edge-TTS neural voice synthesis
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Your API key (git-ignored)
│   └── .env.example         # Template for API key
│
├── frontend/
│   ├── index.html           # Main HUD interface
│   ├── css/
│   │   ├── hud.css          # Core design system (Iron Man theme)
│   │   └── animations.css   # Keyframe animations & effects
│   └── js/
│       ├── app.js           # WebSocket comm & message handling
│       ├── hud.js           # Canvas waveform, clock, system polling
│       └── voice.js         # Speech recognition & audio playback
│
├── start.bat                # Windows one-click launcher
├── .gitignore
└── README.md
```

---

## 🎙️ Voice Commands

| Say this | F.R.I.D.A.Y. does |
|---|---|
| "Open Chrome" | Launches Google Chrome |
| "Search for latest tech news" | Google search in browser |
| "Go to YouTube" | Opens youtube.com |
| "What time is it?" | Tells you the current time |
| "System status" | Shows full system diagnostics |
| "Take a screenshot" | Saves screenshot to Desktop |
| "Tell me a joke" | Natural conversation response |
| "Help me write Python code" | Coding assistance via Gemini |

> **Tip:** Press **Space** anywhere (outside the text box) to activate voice input!

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **AI Brain** | Google Gemini 2.5 Flash |
| **Backend** | Python, FastAPI, WebSocket |
| **Voice Output** | Edge-TTS (Aria Neural) |
| **Voice Input** | Web Speech API (browser) |
| **Frontend** | Vanilla HTML/CSS/JS |
| **System Control** | psutil, subprocess, webbrowser |

---

## ⚠️ Important Notes

- **Local only** — F.R.I.D.A.Y. runs on your machine. System automation (opening apps, screenshots) requires local access.
- **Cannot deploy to Vercel/Netlify** — WebSocket connections and system-level operations require a persistent local server.
- **Windows optimized** — App launching commands are Windows-specific. macOS/Linux users will need to modify `automation.py`.
- **Microphone access** — Browser will ask for mic permission on first voice use.

---

## 📜 License

MIT License — feel free to fork, modify, and build your own AI assistant!

---

<p align="center">
  <em>"I've got you covered."</em> — F.R.I.D.A.Y.
</p>
