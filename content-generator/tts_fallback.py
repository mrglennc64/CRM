"""
Free fallback TTS using Microsoft Edge's neural voices.

Used by video.py ONLY when ELEVENLABS_API_KEY is not set. High quality, no
account required, no cost. The output voice is clearly not your cloned voice
— drop your ElevenLabs key into .env to upgrade.
"""
from __future__ import annotations
import asyncio

# A punchy American female voice — good for "get your bag" / emotional artist posts.
# Other good options:
#   en-US-GuyNeural      — warm male
#   en-US-AriaNeural     — neutral newsroom-style female
#   en-US-JennyNeural    — default friendly female
#   en-GB-RyanNeural     — British male, good for forensic LinkedIn
DEFAULT_VOICE = 'en-US-AriaNeural'


def synthesize(text: str, voice: str = DEFAULT_VOICE, rate: str = '+0%') -> bytes:
    """Return MP3 bytes for `text`. Synchronous wrapper around edge-tts's async API."""
    import edge_tts  # lazy import so generate.py startup isn't slowed

    async def _run() -> bytes:
        communicate = edge_tts.Communicate(text, voice=voice, rate=rate)
        chunks: list[bytes] = []
        async for msg in communicate.stream():
            if msg['type'] == 'audio':
                chunks.append(msg['data'])
        return b''.join(chunks)

    return asyncio.run(_run())
