"""
F.R.I.D.A.Y. Voice Engine — Edge-TTS Neural Voice Synthesis
Uses Microsoft's en-US-AriaNeural voice for a natural female AI assistant voice.
"""

import asyncio
import base64
import io
import edge_tts

# Voice configuration
VOICE = "en-US-AriaNeural"  # Natural female voice
RATE = "+5%"    # Slightly faster for an AI assistant feel
PITCH = "+0Hz"  # Natural pitch


async def synthesize_speech(text: str) -> str:
    """
    Convert text to speech using Edge-TTS and return base64-encoded MP3.
    
    Args:
        text: The text to convert to speech
        
    Returns:
        Base64-encoded MP3 audio string
    """
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)

    # Collect audio chunks into a buffer
    audio_buffer = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_buffer.write(chunk["data"])

    audio_buffer.seek(0)
    audio_bytes = audio_buffer.read()

    # Encode to base64 for WebSocket transmission
    return base64.b64encode(audio_bytes).decode("utf-8")


def text_to_speech(text: str) -> str:
    """
    Synchronous wrapper for synthesize_speech.
    
    Args:
        text: The text to convert to speech
        
    Returns:
        Base64-encoded MP3 audio string
    """
    return asyncio.run(synthesize_speech(text))
