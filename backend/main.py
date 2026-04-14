"""
F.R.I.D.A.Y. - Main Server
FastAPI + WebSocket server that ties everything together.
Serves the frontend and handles real-time AI communication.
"""

import asyncio
import json
import sys
import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv

from ai_brain import FridayBrain
from voice import synthesize_speech
from automation import execute_action, get_system_status

load_dotenv()

# Fix encoding for Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Initialize AI Brain
brain = FridayBrain()

# Frontend directory
FRONTEND_DIR = Path(__file__).parent.parent / "frontend"


@asynccontextmanager
async def lifespan(app):
    """Application startup/shutdown."""
    print("")
    print("  ==================================================")
    print("  |     F.R.I.D.A.Y. AI Assistant v1.0             |")
    print("  |     Server: http://localhost:8000               |")
    print("  |     Status: ONLINE                              |")
    print("  ==================================================")
    print("")
    yield
    print("  F.R.I.D.A.Y. shutting down...")


# Initialize FastAPI with lifespan
app = FastAPI(title="F.R.I.D.A.Y. AI Assistant", lifespan=lifespan)

# Serve frontend static files
app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")


@app.get("/")
async def serve_frontend():
    """Serve the main HUD interface."""
    return FileResponse(str(FRONTEND_DIR / "index.html"))


@app.get("/api/system-status")
async def api_system_status():
    """REST endpoint for system status polling."""
    try:
        status = get_system_status()
        return JSONResponse(content=status)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time AI communication."""
    await websocket.accept()
    print("[FRIDAY] WebSocket connection established.")

    try:
        while True:
            # Receive user message
            data = await websocket.receive_text()
            message = json.loads(data)
            user_text = message.get("text", "")

            if not user_text:
                continue

            print(f"[USER] {user_text}")

            # Send "processing" status
            await websocket.send_text(json.dumps({
                "type": "status",
                "status": "processing"
            }))

            # Process through AI Brain
            result = brain.process(user_text)
            response_text = result["response"]
            print(f"[FRIDAY] {response_text}")

            # Execute system action if detected
            action_result = None
            if result["type"] == "action" and result["action"]:
                action_name = result["action"]["name"]
                action_params = result["action"]["params"]
                action_result = execute_action(action_name, action_params)
                print(f"[ACTION] {action_name} -> {action_result}")

            # Generate voice response
            await websocket.send_text(json.dumps({
                "type": "status",
                "status": "speaking"
            }))

            audio_base64 = None
            try:
                audio_base64 = await synthesize_speech(response_text)
            except Exception as e:
                print(f"[TTS ERROR] {e}")

            # Build system status if requested
            sys_status = None
            if result.get("action") and result["action"] and result["action"].get("name") == "system_status":
                sys_status = get_system_status()

            # Send complete response
            await websocket.send_text(json.dumps({
                "type": "response",
                "text": response_text,
                "audio": audio_base64,
                "action": result.get("action"),
                "action_result": action_result,
                "system_status": sys_status
            }))

    except WebSocketDisconnect:
        print("[FRIDAY] WebSocket connection closed.")
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        try:
            await websocket.send_text(json.dumps({
                "type": "error",
                "text": f"System error: {str(e)}"
            }))
        except:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000)
