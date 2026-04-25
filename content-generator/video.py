#!/usr/bin/env python3
"""
Reel video composer — combines beat PNGs + ElevenLabs voiceovers into a finished MP4.

Pipeline per slot directory (e.g. output/<stamp>/<brand>/<day>_tiktok/):
  1. Read script.txt → parse HOOK / PAIN / EXAMPLE / FIX / CTA sections.
  2. For each voiceover section (PAIN, EXAMPLE, FIX, CTA):
       - Call ElevenLabs via tts.py using the hardcoded VOICE_ID.
       - Save audio/<beat>.mp3 next to the PNGs.
  3. Beat 1 (HOOK) gets a silent 2.5s hold (viewer reads the hook).
  4. Stitch: each beat-N.png displays for its audio's duration.
  5. Write reel.mp4 at the slot directory root.

Uses MoviePy with imageio-ffmpeg's bundled ffmpeg — no system ffmpeg required.

Usage (standalone):
    python video.py <path-to-reel-folder>

Or via generate.py:
    python generate.py --insight <id> --brand <brand> --format tiktok --save --video
"""
from __future__ import annotations
import argparse
import io
import sys
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

ROOT = Path(__file__).parent

# Reuse the existing TTS plumbing (ElevenLabs primary) + fallback (Edge TTS)
from tts import tts, get_api_key, build_voiceover_from_script, VOICE_ID  # noqa: E402
from tts_fallback import synthesize as fallback_synthesize  # noqa: E402


def _resolve_tts_backend():
    """
    Return ('elevenlabs', api_key) if a real ELEVENLABS_API_KEY is available,
    else ('edge', None) for the free Microsoft Edge neural fallback.
    """
    import os
    # Load .env without exiting if key is missing
    from tts import load_env
    load_env()
    key = os.environ.get('ELEVENLABS_API_KEY', '').strip()
    # Reject obvious placeholder values
    if key and not key.lower().startswith(('sk_xx', 'your_', 'paste')):
        return ('elevenlabs', key)
    return ('edge', None)

# Map script section headers → beat numbers + PNG filenames.
# HOOK has no audio (on-screen only). PAIN onward are narrated beats.
BEAT_MAP = [
    # (beat_number, script_section_key, png_filename, audio_filename_or_None, fallback_hold_seconds)
    (1, 'hook',         'beat-1.png', None,         2.5),
    (2, 'pain',         'beat-2.png', 'pain.mp3',   None),
    (3, 'real example', 'beat-3.png', 'example.mp3', None),
    (4, 'fix',          'beat-4.png', 'fix.mp3',    None),
    (5, 'cta',          'beat-5.png', 'cta.mp3',    None),
]


def _parse_script_sections(script_text: str) -> dict[str, str]:
    """Extract each labeled section from a TikTok script. Returns {section_key: text}."""
    out: dict[str, list[str]] = {}
    current = None
    # Meta labels that appear below the final border and must NOT leak into the CTA section
    META_PREFIXES = ('tone:', 'length:', 'caption:', 'design:', 'target:')
    for line in script_text.split('\n'):
        s = line.strip()
        if not s:
            continue
        # A '====' border line terminates the current section
        if s.startswith(('=', '-')) and len(set(s)) <= 2:
            current = None
            continue
        # Section header ends with ':' and is short
        if s.endswith(':') and len(s) < 80 and not s.lower().startswith(META_PREFIXES):
            head = s.rstrip(':').strip()
            key = head.split('(')[0].strip().lower()
            current = key
            out[current] = []
            continue
        # Skip meta labels (tone:, length:, caption:, etc.) that sit below the final border
        if s.lower().startswith(META_PREFIXES):
            current = None
            continue
        if current:
            out[current].append(s)
    return {k: ' '.join(v).strip() for k, v in out.items()}


def _ensure_audio(reel_dir: Path, script_sections: dict, backend: str, api_key: str | None,
                  force: bool = False) -> dict[int, Path | None]:
    """Generate (or load cached) MP3 per beat. Returns {beat_num: audio_path or None}."""
    audio_dir = reel_dir / 'audio'
    audio_dir.mkdir(exist_ok=True)
    result: dict[int, Path | None] = {}

    for beat_num, section_key, _png, audio_filename, _hold in BEAT_MAP:
        if audio_filename is None:
            result[beat_num] = None
            continue
        audio_path = audio_dir / audio_filename
        if audio_path.exists() and not force:
            result[beat_num] = audio_path
            print(f'  · reuse {audio_path.relative_to(reel_dir)}')
            continue
        text = script_sections.get(section_key, '').strip()
        if not text:
            print(f'  · no text for {section_key} — skipping')
            result[beat_num] = None
            continue
        print(f'  → TTS [{backend}] {section_key} ({len(text)} chars) ...', end='', flush=True)
        if backend == 'elevenlabs':
            audio_bytes = tts(text, api_key=api_key, voice_id=VOICE_ID)
        else:
            audio_bytes = fallback_synthesize(text)
        audio_path.write_bytes(audio_bytes)
        print(f' {len(audio_bytes) / 1024:.1f} KB')
        result[beat_num] = audio_path
    return result


def _build_mp4(reel_dir: Path, audio_paths: dict[int, Path | None], out_path: Path) -> Path:
    """Stitch the beat PNGs + audio into a single MP4 with MoviePy."""
    # Lazy import so `python video.py --help` and tests don't pay the cost
    from moviepy import ImageClip, AudioFileClip, concatenate_videoclips, CompositeAudioClip

    segments = []
    audio_pieces = []
    cursor = 0.0

    for beat_num, _section, png_name, _audio_name, hold in BEAT_MAP:
        png_path = reel_dir / png_name
        if not png_path.exists():
            print(f'  ! missing {png_path.name}, skipping')
            continue

        audio_path = audio_paths.get(beat_num)
        if audio_path and audio_path.exists():
            clip_audio = AudioFileClip(str(audio_path))
            # Add a short pause (0.25s) between beats for breathing room
            duration = clip_audio.duration + 0.25
            placed = clip_audio.with_start(cursor)
            audio_pieces.append(placed)
            img_clip = ImageClip(str(png_path), duration=duration)
            segments.append(img_clip)
            print(f'  · beat {beat_num}: {png_name} for {duration:.2f}s (narrated)')
        else:
            duration = hold if hold else 2.0
            img_clip = ImageClip(str(png_path), duration=duration)
            segments.append(img_clip)
            print(f'  · beat {beat_num}: {png_name} for {duration:.2f}s (silent hook hold)')
        cursor += duration

    if not segments:
        raise RuntimeError('No beats rendered — no PNGs found?')

    video = concatenate_videoclips(segments, method='compose')
    if audio_pieces:
        composite_audio = CompositeAudioClip(audio_pieces)
        video = video.with_audio(composite_audio)

    print(f'  → encoding {out_path.name} ...', flush=True)
    video.write_videofile(
        str(out_path),
        fps=30,
        codec='libx264',
        audio_codec='aac',
        preset='medium',
        logger=None,  # silence MoviePy's progress bar
        threads=2,
    )
    return out_path


def render_reel_mp4(reel_dir: Path, force: bool = False) -> Path:
    """
    Top-level: given a directory containing beat-1.png…beat-5.png + script.txt,
    generate voiceovers and produce reel.mp4 inside the same directory.
    """
    reel_dir = Path(reel_dir)
    if not reel_dir.is_dir():
        raise FileNotFoundError(f'Not a directory: {reel_dir}')

    script_path = reel_dir / 'script.txt'
    if not script_path.exists():
        raise FileNotFoundError(f'script.txt not found in {reel_dir}')

    script_sections = _parse_script_sections(script_path.read_text(encoding='utf-8'))
    if not script_sections:
        raise RuntimeError('Could not parse script.txt into sections')

    backend, api_key = _resolve_tts_backend()
    print(f'Composing reel in {reel_dir}')
    if backend == 'edge':
        print('  ⚠ ELEVENLABS_API_KEY not set — using FREE Edge neural TTS (not your cloned voice).')
        print('     To use your ElevenLabs voice, add ELEVENLABS_API_KEY to content-generator/.env and re-run.')
    audio_paths = _ensure_audio(reel_dir, script_sections, backend=backend, api_key=api_key, force=force)

    out_path = reel_dir / 'reel.mp4'
    if out_path.exists() and not force:
        out_path.unlink()
    return _build_mp4(reel_dir, audio_paths, out_path)


def main():
    parser = argparse.ArgumentParser(description='Compose reel.mp4 from beat PNGs + ElevenLabs voiceovers.')
    parser.add_argument('reel_dir', help='Path to the folder containing beat-*.png and script.txt')
    parser.add_argument('--force', action='store_true', help='Re-render audio + MP4 even if they exist')
    args = parser.parse_args()
    try:
        out = render_reel_mp4(Path(args.reel_dir), force=args.force)
        print(f'\n✔ {out}')
    except SystemExit:
        raise
    except Exception as e:
        print(f'\n✘ {e}', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
