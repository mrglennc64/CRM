#!/usr/bin/env python3
"""
ElevenLabs TTS — generates voiceover MP3s for TikTok/Reel scripts using your cloned voice.

Voice ID is hardcoded to the user's cloned voice (tXoAX6rzg9vkoUfJKy0k).
API key is read from ELEVENLABS_API_KEY in .env (or environment).

Used by generate.py when --tts is passed. Can also be run standalone to
render MP3s for every tiktok .txt already in output/.

Standalone usage:
    python tts.py                    # render MP3s for all tiktok scripts missing audio
    python tts.py --force            # re-render even if MP3 exists
    python tts.py --dry-run          # print what would be generated, no API calls
"""
import argparse
import io
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

# Force UTF-8 stdout on Windows so arrows/checkmarks print correctly
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

ROOT = Path(__file__).parent
OUTPUT_DIR = ROOT / 'output'
BRANDS_PATH = ROOT / 'brands.json'

# Your cloned voice
VOICE_ID = 'tXoAX6rzg9vkoUfJKy0k'
MODEL = 'eleven_multilingual_v2'
OUTPUT_FORMAT = 'mp3_44100_128'
API_BASE = 'https://api.elevenlabs.io/v1'


def load_env():
    """Load .env from content-generator/ or parent marketing/ folder."""
    for path in [ROOT / '.env', ROOT.parent / '.env']:
        if not path.exists():
            continue
        for line in path.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            os.environ.setdefault(k.strip(), v.strip())


def get_api_key():
    load_env()
    key = os.environ.get('ELEVENLABS_API_KEY', '').strip()
    if not key:
        sys.exit(
            'ELEVENLABS_API_KEY not found.\n'
            'Add it to content-generator/.env:\n'
            '    ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxx\n'
            'Get yours at https://elevenlabs.io/app/settings/api-keys'
        )
    return key


def tts(text: str, api_key: str, voice_id: str = VOICE_ID, model: str = MODEL) -> bytes:
    """Synthesize text → MP3 bytes via ElevenLabs REST API."""
    if not text.strip():
        raise ValueError('Empty text')
    url = f'{API_BASE}/text-to-speech/{voice_id}?output_format={OUTPUT_FORMAT}'
    body = json.dumps({
        'text': text,
        'model_id': model,
        'voice_settings': {
            'stability': 0.5,
            'similarity_boost': 0.8,
            'style': 0.2,
            'use_speaker_boost': True,
        },
    }).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=body,
        method='POST',
        headers={
            'xi-api-key': api_key,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        detail = e.read().decode('utf-8', errors='replace')
        raise RuntimeError(f'ElevenLabs HTTP {e.code}: {detail[:400]}') from e


# ------------------------------------------------------------------
#  Extract speakable voiceover from a tiktok script .txt
# ------------------------------------------------------------------

def build_voiceover_from_script(script_text: str) -> str:
    """
    Pull the actually-spoken lines out of a TikTok/Reel script.
    The script is laid out with labeled sections:
        HOOK (on-screen text, ...):       ← NOT spoken
        PAIN (voiceover, ...):            ← spoken
        REAL EXAMPLE (voiceover):         ← spoken
        FIX (quick, non-technical):       ← spoken
        CTA:                              ← spoken
    We extract PAIN + REAL EXAMPLE + FIX + CTA and concat into a natural script.
    """
    lines = script_text.split('\n')
    sections = {}
    current = None
    for ln in lines:
        s = ln.strip()
        if not s:
            continue
        # section header ends with ':' — e.g. "PAIN (voiceover, 1-2 sentences):"
        if s.endswith(':') and s.isupper() is False:
            head = s.rstrip(':').strip()
            key = head.split('(')[0].strip().lower()
            current = key
            sections[current] = []
            continue
        if current:
            if s.startswith('=') or s.startswith('-'):  # border/divider
                continue
            sections[current].append(s)

    # Concat in spoken order: pain → real example → fix → cta
    order = ['pain', 'real example', 'fix', 'cta']
    parts = []
    for k in order:
        if k in sections and sections[k]:
            parts.append(' '.join(sections[k]))
    return '\n\n'.join(parts).strip()


def find_tiktok_scripts():
    """Walk output/ and find all tiktok .txt files that don't have an MP3 next to them."""
    hits = []
    if not OUTPUT_DIR.exists():
        return hits
    for p in OUTPUT_DIR.rglob('*.txt'):
        name = p.name.lower()
        if 'tiktok' not in name:
            continue
        mp3 = p.with_suffix('.mp3')
        hits.append((p, mp3))
    return hits


def render_for_script(txt_path: Path, mp3_path: Path, api_key: str, force=False, dry_run=False):
    if mp3_path.exists() and not force:
        return False, 'exists'
    script = txt_path.read_text(encoding='utf-8')
    voiceover = build_voiceover_from_script(script)
    if not voiceover:
        return False, 'empty voiceover'
    if dry_run:
        print(f'[dry-run] would render {len(voiceover)} chars → {mp3_path.name}')
        print(f'          preview: {voiceover[:120]!r}')
        return True, 'dry-run'
    audio = tts(voiceover, api_key=api_key)
    mp3_path.write_bytes(audio)
    return True, f'{len(audio)} bytes'


def main():
    parser = argparse.ArgumentParser(description='Generate ElevenLabs MP3s for TikTok scripts in output/.')
    parser.add_argument('--force', action='store_true', help='Re-render existing MP3s')
    parser.add_argument('--dry-run', action='store_true', help='Print plan, no API calls')
    args = parser.parse_args()

    scripts = find_tiktok_scripts()
    if not scripts:
        print('No tiktok scripts found under output/. Run generate.py --weekly --save first.')
        return

    print(f'Found {len(scripts)} tiktok script(s).')

    api_key = None if args.dry_run else get_api_key()

    done = 0
    skipped = 0
    for txt_path, mp3_path in scripts:
        rel = txt_path.relative_to(ROOT)
        try:
            did, note = render_for_script(txt_path, mp3_path, api_key=api_key, force=args.force, dry_run=args.dry_run)
            if did:
                print(f'  ✔ {rel}  →  {mp3_path.name}  ({note})')
                done += 1
            else:
                print(f'  · skip {rel}  ({note})')
                skipped += 1
        except Exception as e:
            print(f'  ✗ fail {rel}  —  {e}')

    print(f'\nRendered: {done}, skipped: {skipped}')


if __name__ == '__main__':
    main()
