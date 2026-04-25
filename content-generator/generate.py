#!/usr/bin/env python3
"""
TrapRoyaltiesPro Content Engine
Generates TikTok/IG Reel, IG Carousel (with PNG slides), LinkedIn, Threads, and X/Twitter posts
from insights in content_brain.json.

Output layout (new):
    output/
    └── 2026-04-24_weekly_<insight-id>/
        ├── bundle.md                       # index + full text bundle
        ├── heyroya/
        │   ├── friday_linkedin.txt
        │   └── threads.txt
        ├── trp-pro/
        │   ├── monday_linkedin.txt
        │   └── threads.txt
        ├── verseiq/
        │   ├── tuesday_tiktok.txt
        │   ├── thursday_carousel/
        │   │   ├── script.txt              # 6-slide text breakdown
        │   │   ├── caption.txt             # short IG caption
        │   │   ├── slide-1.png             # rendered PNG slides
        │   │   ├── slide-2.png
        │   │   ├── slide-3.png
        │   │   ├── slide-4.png
        │   │   ├── slide-5.png
        │   │   └── slide-6.png
        │   └── threads.txt
        └── traproyalties/
            ├── tuesday_tiktok.txt
            └── threads.txt

Usage:
    python generate.py --list
    python generate.py --insight unmatched-isrcs --brand heyroya --format linkedin
    python generate.py --insight unmatched-isrcs --brand verseiq --format carousel --save
    python generate.py --weekly --save
"""
import argparse
import io
import json
import sys
import webbrowser
from datetime import datetime
from pathlib import Path

from preview_html import build_bundle_preview


def _open_in_browser(path: Path) -> bool:
    """Open a file path in the user's default browser. Returns True on success."""
    try:
        return webbrowser.open(path.resolve().as_uri())
    except Exception as e:
        print(f'(auto-open failed: {e})')
        return False

# Force UTF-8 stdout on Windows so em-dashes and Euro signs print correctly
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

ROOT = Path(__file__).parent
BRAIN_PATH = ROOT / 'content_brain.json'
BRANDS_PATH = ROOT / 'brands.json'
TEMPLATES_DIR = ROOT / 'templates'
OUTPUT_DIR = ROOT / 'output'
FONTS_DIR = ROOT / 'fonts'

FORMATS = ['tiktok', 'carousel', 'linkedin', 'threads', 'twitter']

# Weekly cadence — (day, format, brand_id)
# Carousel slot writes a folder (script + caption + 6 PNGs); other slots write a single .txt file.
WEEKLY_SCHEDULE = [
    ('monday',    'linkedin', 'trp-pro'),
    ('tuesday',   'tiktok',   'traproyalties'),
    ('tuesday',   'tiktok',   'verseiq'),      # also IG Reel
    ('thursday',  'carousel', 'verseiq'),
    ('friday',    'linkedin', 'heyroya'),
    ('threads',   'threads',  'heyroya'),
    ('threads',   'threads',  'trp-pro'),
    ('threads',   'threads',  'verseiq'),
    ('threads',   'threads',  'traproyalties'),
]

# PNG slide canvas — IG portrait, matches the carousel spec.
SLIDE_WIDTH, SLIDE_HEIGHT = 1080, 1350
SLIDE_PADDING = 80

# Reel / TikTok canvas — 9:16 vertical.
REEL_WIDTH, REEL_HEIGHT = 1080, 1920
REEL_PADDING = 100

# Slide type → source field in the insight (for carousel rendering).
# (kicker label, source field, tone)
CAROUSEL_SLIDES = [
    ('Slide 1 / 6',         'emotionalHook',    'hero'),
    ('Why this happens',    'problem',          'body'),
    ('Real example',        'example',          'number'),
    ('What you lose',       'impact',           'body'),
    ('How to fix it',       'fix',              'body'),
    ('Your next step',      'cta',              'cta'),
]

# Reel beats — 5 vertical cards matching the TikTok/IG Reel template structure.
REEL_BEATS = [
    ('Beat 1 / 5 · Hook',    'emotionalHook',  'hero',    '0–3s'),
    ('Beat 2 / 5 · Pain',    'pain_combo',     'body',    '3–8s'),
    ('Beat 3 / 5 · Example', 'example',        'number',  '8–14s'),
    ('Beat 4 / 5 · Fix',     'fix',            'body',    '14–18s'),
    ('Beat 5 / 5 · CTA',     'cta_text',       'cta',     '18–22s'),
]


def load_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def load_template(fmt):
    path = TEMPLATES_DIR / f'{fmt}.txt'
    if not path.exists():
        sys.exit(f'Template not found: {path}')
    return path.read_text(encoding='utf-8')


def find_insight(brain, iid):
    for ins in brain['insights']:
        if ins['id'] == iid:
            return ins
    sys.exit(f'Insight not found: {iid}. Run --list to see all.')


def render(insight, brand, fmt):
    template = load_template(fmt)
    ctx = {
        **insight,
        'brand_name': brand['name'],
        'brand_url': brand['url'],
        'cta': brand['cta'],
        'audience': brand['audience'],
    }
    try:
        return template.format(**ctx)
    except KeyError as e:
        return f'[Template error: missing field {e}]\n{template}'


# ----------------------------- PNG rendering -----------------------------

def _load_pil():
    """Import Pillow lazily so --list and text-only commands work without it installed."""
    try:
        from PIL import Image, ImageDraw, ImageFont  # noqa
        return Image, ImageDraw, ImageFont
    except ImportError:
        sys.exit(
            'Pillow is required for PNG carousel rendering.\n'
            '  pip install -r requirements.txt\n'
            '(or) pip install Pillow'
        )


def _resolve_font(preferred_names, size):
    """Try brand fonts in FONTS_DIR, then fall back to Pillow's default."""
    from PIL import ImageFont
    for name in preferred_names:
        p = FONTS_DIR / name
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size=size)
            except Exception:
                pass
    # Try a couple of common system fonts that ship on Windows
    for sys_name in ['arialbd.ttf', 'arial.ttf', 'seguiemj.ttf']:
        try:
            return ImageFont.truetype(sys_name, size=size)
        except Exception:
            pass
    return ImageFont.load_default()


def _wrap(draw, text, font, max_width):
    """Word-wrap text to fit max_width (pixels). Returns a list of lines."""
    words = text.split()
    if not words:
        return ['']
    lines = []
    cur = words[0]
    for w in words[1:]:
        test = f'{cur} {w}'
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] <= max_width:
            cur = test
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    return lines


def _draw_text_block(draw, text, font, fill, x, y, max_width, line_gap=1.15):
    """Render wrapped text starting at (x, y). Returns y-coordinate after the block."""
    lines = _wrap(draw, text, font, max_width)
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        draw.text((x, y), line, font=font, fill=fill)
        y += int((bbox[3] - bbox[1]) * line_gap) + 8
    return y


def _extract_big_number(text):
    """Try to pull a punchy number/$ amount out of example text for the hero slide."""
    import re
    m = re.search(r'(?:CA\$|US\$|€|\$|£)\s?[\d,]+(?:\.\d+)?', text)
    if m:
        return m.group(0).replace(' ', '')
    m = re.search(r'\d+\s?[–\-]\s?\d+\s?%', text)
    if m:
        return m.group(0).replace(' ', '')
    m = re.search(r'\d[\d,]*', text)
    return m.group(0) if m else '!'


def _resolve_field_text(insight, brand, field):
    """Pull the right string for a given beat/slide field."""
    if field == 'pain_combo':
        return f"{insight.get('problem', '')}. {insight.get('impact', '')}"
    if field == 'cta_text':
        return brand.get('cta', '')
    return insight.get(field, '')


def _render_slide(Image, ImageDraw, insight, brand, slide_idx, total_slides, kicker, field, tone,
                  width=SLIDE_WIDTH, height=SLIDE_HEIGHT, padding=SLIDE_PADDING):
    """Render one PNG slide at the given canvas size. Returns a PIL Image."""
    palette = brand['palette']
    bg = palette['bg']
    ink = palette['ink']
    ink_muted = palette['ink_muted']
    accent = palette['accent']
    accent2 = palette.get('accent2', accent)

    img = Image.new('RGB', (width, height), bg)
    draw = ImageDraw.Draw(img)

    inner_w = width - padding * 2

    # Size font & spacing scale with canvas height so 9:16 Reel cards look balanced
    tall = height >= 1600
    headline_size = 110 if tall else 92
    body_size = 40 if tall else 36
    number_size = 260 if tall else 220
    kicker_size = 30 if tall else 26

    # Accent bar (all slides except the final CTA)
    if tone != 'cta':
        draw.rectangle(
            [padding, padding, padding + 80, padding + 7],
            fill=accent,
        )

    # Kicker label
    kicker_font = _resolve_font(['Inter-SemiBold.ttf', 'Inter-Medium.ttf'], kicker_size)
    kicker_text = f'{brand["name"].upper()} · {kicker.upper()}'
    draw.text((padding, padding + 36), kicker_text, font=kicker_font, fill=accent)

    # Main content
    y = padding + (160 if tall else 120)
    text = _resolve_field_text(insight, brand, field)

    if tone == 'number':
        big = _extract_big_number(text)
        # Auto-fit: shrink until the number fits within inner_w
        target_size = number_size
        huge_font = _resolve_font(['Inter-Black.ttf', 'Inter-ExtraBold.ttf', 'Inter-Bold.ttf'], target_size)
        while target_size > 80:
            bbox = draw.textbbox((0, 0), big, font=huge_font)
            if (bbox[2] - bbox[0]) <= inner_w:
                break
            target_size -= 12
            huge_font = _resolve_font(['Inter-Black.ttf', 'Inter-ExtraBold.ttf', 'Inter-Bold.ttf'], target_size)
        draw.text((padding, y), big, font=huge_font, fill=accent)
        y += int(target_size * 1.15)
        body_font = _resolve_font(['Inter-Medium.ttf', 'Inter-Regular.ttf'], body_size)
        y = _draw_text_block(draw, text, body_font, ink, padding, y, inner_w)
    elif tone == 'hero' or tone == 'cta':
        size = headline_size if tone == 'hero' else (95 if tall else 78)
        head_font = _resolve_font(['Inter-ExtraBold.ttf', 'Inter-Bold.ttf'], size)
        y = _draw_text_block(draw, text, head_font, ink, padding, y, inner_w, line_gap=1.08)

        if tone == 'cta':
            # Pill with the brand URL — radius = half the pill height for clean rounded ends
            pill_font = _resolve_font(['Inter-Bold.ttf', 'Inter-SemiBold.ttf'], 34 if tall else 30)
            pill_text = f'→ {brand["url"]}'
            pbox = draw.textbbox((0, 0), pill_text, font=pill_font)
            pad_x, pad_y = 32, 20
            pw = (pbox[2] - pbox[0]) + pad_x * 2
            ph = (pbox[3] - pbox[1]) + pad_y * 2
            px = padding
            py = y + (60 if tall else 40)
            draw.rounded_rectangle([px, py, px + pw, py + ph], radius=ph // 2, fill=accent)
            draw.text((px + pad_x, py + pad_y - 4), pill_text, font=pill_font, fill=bg)
    else:
        head_font = _resolve_font(['Inter-ExtraBold.ttf', 'Inter-Bold.ttf'], 82 if tall else 70)
        y = _draw_text_block(draw, text, head_font, ink, padding, y, inner_w, line_gap=1.12)

    # Footer: brand name + URL
    foot_font = _resolve_font(['Inter-Medium.ttf', 'Inter-Regular.ttf'], 26 if tall else 22)
    foot_y = height - padding - 24
    draw.text((padding, foot_y), brand['name'].upper(), font=foot_font, fill=ink_muted)
    url_text = brand['url']
    ubox = draw.textbbox((0, 0), url_text, font=foot_font)
    draw.text(
        (width - padding - (ubox[2] - ubox[0]), foot_y),
        url_text,
        font=foot_font,
        fill=ink_muted,
    )

    # Page indicator
    idx_font = _resolve_font(['Inter-SemiBold.ttf', 'Inter-Medium.ttf'], 24 if tall else 20)
    draw.text(
        (width - padding - 80, padding + 36),
        f'{slide_idx + 1}/{total_slides}',
        font=idx_font,
        fill=accent2,
    )

    return img


def render_carousel_pngs(insight, brand, out_dir):
    """Render all 6 carousel slides (1080x1350) as PNGs into out_dir. Returns list of paths."""
    Image, ImageDraw, _ = _load_pil()
    out_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    total = len(CAROUSEL_SLIDES)
    for i, (kicker, field, tone) in enumerate(CAROUSEL_SLIDES):
        img = _render_slide(Image, ImageDraw, insight, brand, i, total, kicker, field, tone,
                             width=SLIDE_WIDTH, height=SLIDE_HEIGHT, padding=SLIDE_PADDING)
        p = out_dir / f'slide-{i + 1}.png'
        img.save(p, 'PNG', optimize=True)
        paths.append(p)
    return paths


def render_reel_beats_pngs(insight, brand, out_dir):
    """Render all 5 Reel beat cards (1080x1920) as PNGs. Returns list of paths."""
    Image, ImageDraw, _ = _load_pil()
    out_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    total = len(REEL_BEATS)
    for i, (kicker, field, tone, _timing) in enumerate(REEL_BEATS):
        img = _render_slide(Image, ImageDraw, insight, brand, i, total, kicker, field, tone,
                             width=REEL_WIDTH, height=REEL_HEIGHT, padding=REEL_PADDING)
        p = out_dir / f'beat-{i + 1}.png'
        img.save(p, 'PNG', optimize=True)
        paths.append(p)
    return paths


def _reel_shotlist(insight, brand):
    """Recording cheat sheet — what to say when, what on-screen text to show, CTA."""
    lines = [
        f"# Reel Shot List — {brand['name']}",
        f"Insight: **{insight['problem']}**",
        '',
        f"| # | Beat | Timing | On-screen text | Voiceover |",
        f"|---|------|--------|----------------|-----------|",
    ]
    for i, (kicker, field, tone, timing) in enumerate(REEL_BEATS):
        on_screen = _resolve_field_text(insight, brand, field).replace('|', '/')
        if tone == 'hero':
            vo = f"Say the hook out loud, or let the on-screen text carry it."
        elif tone == 'body' and field == 'pain_combo':
            vo = f"Deliver the pain as two quick sentences. No jargon."
        elif tone == 'number':
            vo = f"Lead with the number. '{_extract_big_number(on_screen)}' — then explain in one breath."
        elif tone == 'body':
            vo = f"Deliver the fix in one confident line. Slow down a touch here."
        else:
            vo = f"Point to the bio link. End on eye contact."
        beat_label = kicker.split('·', 1)[-1].strip()
        lines.append(f"| {i+1} | {beat_label} | {timing} | {on_screen} | {vo} |")
    lines.append('')
    lines.append('## How to post as a Reel')
    lines.append('')
    lines.append('**Option A — Record yourself (recommended):**')
    lines.append('1. Open IG or TikTok → new Reel.')
    lines.append('2. Film each beat (phone portrait, natural light, eye contact).')
    lines.append('3. Use `beat-N.png` as the on-screen text for the corresponding section — paste into the Reel editor as a sticker or overlay.')
    lines.append('4. Keep total length 15–22 seconds.')
    lines.append('5. Caption in the post body: the hook + CTA.')
    lines.append('')
    lines.append('**Option B — Photo slideshow Reel (zero filming):**')
    lines.append('1. IG: new Reel → Add → select all 5 `beat-N.png` files in order.')
    lines.append('2. Set duration to ~3.5s per image (5 × 3.5 ≈ 17.5s).')
    lines.append('3. Add trending audio or a subtle beat.')
    lines.append('4. Caption: same hook + CTA.')
    lines.append('')
    lines.append(f"**Caption template (ready to paste):**")
    lines.append('```')
    lines.append(insight.get('emotionalHook', '').strip())
    lines.append('')
    lines.append(brand['cta'])
    lines.append('```')
    return '\n'.join(lines)


def _carousel_caption(insight, brand):
    """Short-form IG post caption to accompany the 6 slides."""
    return (
        f"{insight.get('emotionalHook', '').strip()}\n\n"
        f"Here's what's really going on →\n\n"
        f"• {insight['problem']}\n"
        f"• {insight['impact']}\n"
        f"• Real case: {insight['example']}\n"
        f"• Fix: {insight['fix']}\n\n"
        f"{brand['cta']}\n\n"
        f".\n.\n"
        f"#musicpublishing #royalties #metadata #independentartist "
        f"#musicbusiness #catalogaudit #songwriter #producer"
    )


# ----------------------------- file writing -----------------------------

FORMAT_FILENAME = {
    'linkedin': 'linkedin.txt',
    'tiktok':   'tiktok.txt',
    'threads':  'threads.txt',
    'twitter':  'twitter.txt',
}

# Module-level collector: populated by write_slot() for any tiktok slot,
# consumed by the command functions when --video is passed.
_reel_dirs_to_video: list = []


def _slot_filename(day, fmt):
    """Unique per-day-format filename for within a brand folder."""
    if fmt == 'threads':
        return 'threads.txt'          # threads is daily, single file
    if fmt == 'twitter':
        return 'twitter.txt'
    return f'{day.lower()}_{fmt}.txt'


def write_slot(bundle_dir, insight, brand_id, brand, day, fmt, slot_text):
    """Write one slot's output(s) into bundle_dir/<brand_id>/ . Returns list of files written."""
    brand_dir = bundle_dir / brand_id
    brand_dir.mkdir(parents=True, exist_ok=True)
    written = []

    if fmt == 'carousel':
        carousel_dir = brand_dir / f'{day.lower()}_carousel'
        carousel_dir.mkdir(exist_ok=True)
        # Full text breakdown
        script_path = carousel_dir / 'script.txt'
        script_path.write_text(slot_text, encoding='utf-8')
        written.append(script_path)
        # Short-form caption for the IG post body
        caption_path = carousel_dir / 'caption.txt'
        caption_path.write_text(_carousel_caption(insight, brand), encoding='utf-8')
        written.append(caption_path)
        # 6 PNG slides
        try:
            written.extend(render_carousel_pngs(insight, brand, carousel_dir))
        except SystemExit:
            raise
        except Exception as e:
            err_path = carousel_dir / 'render-error.txt'
            err_path.write_text(f'PNG rendering failed: {e}\n', encoding='utf-8')
            written.append(err_path)
    elif fmt == 'tiktok':
        reel_dir = brand_dir / f'{day.lower()}_tiktok'
        reel_dir.mkdir(exist_ok=True)
        # Full script
        script_path = reel_dir / 'script.txt'
        script_path.write_text(slot_text, encoding='utf-8')
        written.append(script_path)
        # Shot list / teleprompter
        shotlist_path = reel_dir / 'reel-shotlist.md'
        shotlist_path.write_text(_reel_shotlist(insight, brand), encoding='utf-8')
        written.append(shotlist_path)
        # Caption to paste into the Reel post
        caption_path = reel_dir / 'caption.txt'
        caption_text = f"{insight.get('emotionalHook', '').strip()}\n\n{brand['cta']}"
        caption_path.write_text(caption_text, encoding='utf-8')
        written.append(caption_path)
        # 5 vertical beat cards
        try:
            written.extend(render_reel_beats_pngs(insight, brand, reel_dir))
        except SystemExit:
            raise
        except Exception as e:
            err_path = reel_dir / 'render-error.txt'
            err_path.write_text(f'PNG rendering failed: {e}\n', encoding='utf-8')
            written.append(err_path)
        # Tag this folder as a reel-capable dir so the caller can invoke video rendering
        # after all slots are written (video rendering is opt-in and costs ElevenLabs credits).
        _reel_dirs_to_video.append(reel_dir)
    else:
        filename = _slot_filename(day, fmt)
        path = brand_dir / filename
        path.write_text(slot_text, encoding='utf-8')
        written.append(path)

    return written


# ----------------------------- commands -----------------------------

def cmd_list(brain):
    print(f"{'ID':<35} {'AUDIENCE':<22} {'PROBLEM'}")
    print('-' * 100)
    for ins in brain['insights']:
        print(f"{ins['id']:<35} {ins['who'][:21]:<22} {ins['problem']}")
    print(f"\n{len(brain['insights'])} insights total.")


def cmd_brands(brands):
    print(f"{'ID':<18} {'NAME':<22} {'AUDIENCE':<12} {'MODE':<6} VOICE")
    print('-' * 80)
    for bid, b in brands.items():
        print(f"{bid:<18} {b['name']:<22} {b['audience']:<12} {b.get('mode','dark'):<6} {b['voice']}")


def _render_pending_reels():
    """Run ElevenLabs TTS + MoviePy stitching on every reel dir queued by write_slot()."""
    if not _reel_dirs_to_video:
        return []
    try:
        from video import render_reel_mp4
    except ImportError as e:
        print(f'(video rendering skipped — {e})')
        return []
    mp4s = []
    for reel_dir in _reel_dirs_to_video:
        try:
            print(f'\n🎬 Rendering reel.mp4 for {reel_dir.name} ...')
            mp4 = render_reel_mp4(reel_dir)
            mp4s.append(mp4)
            print(f'   ✔ {mp4.relative_to(ROOT)}')
        except SystemExit as e:
            # tts.get_api_key() calls sys.exit with a message if ELEVENLABS_API_KEY is missing.
            # Surface that message so the user knows exactly what to do.
            msg = str(e) if str(e) and not str(e).isdigit() else 'API key missing'
            print('   ✘ video rendering blocked:')
            for line in msg.splitlines():
                print(f'     {line}')
            print('   (resolve the above and re-run with --video)')
            break
        except Exception as e:
            print(f'   ✘ {e}')
    _reel_dirs_to_video.clear()
    return mp4s


def cmd_generate(brain, brands, iid, brand_id, fmt, save=False, open_browser=True, video=False):
    """Single-insight single-brand generation. Writes to its own folder if --save."""
    insight = find_insight(brain, iid)
    if brand_id not in brands:
        sys.exit(f'Brand not found: {brand_id}. Options: {", ".join(brands.keys())}')
    brand = brands[brand_id]

    formats = FORMATS if fmt == 'all' else [fmt]
    for f in formats:
        if f not in FORMATS:
            print(f'Unknown format: {f} (skipping)')
            continue

    if not save:
        # Print-only mode — show each format to stdout
        chunks = []
        for f in formats:
            chunks.append(render(insight, brand, f))
        print('\n\n'.join(chunks))
        return

    # --save: folder structure
    stamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    bundle_dir = OUTPUT_DIR / f'{stamp}_{iid}_{brand_id}'
    bundle_dir.mkdir(parents=True, exist_ok=True)

    all_written = []
    for f in formats:
        slot_text = render(insight, brand, f)
        # Reuse the weekly writer — use 'adhoc' as the day label
        written = write_slot(bundle_dir, insight, brand_id, brand, 'adhoc', f, slot_text)
        all_written.extend(written)

    # Index file
    index_lines = [
        f'# {brand["name"]} — {iid}',
        '',
        f'Formats: {", ".join(formats)}',
        f'Generated: {datetime.now().isoformat(timespec="seconds")}',
        '',
        '## Files',
    ]
    for p in all_written:
        index_lines.append(f'- `{p.relative_to(bundle_dir).as_posix()}`')
    (bundle_dir / 'bundle.md').write_text('\n'.join(index_lines), encoding='utf-8')

    # Optional: render reel.mp4 for any tiktok slot written above
    mp4_paths = _render_pending_reels() if video else []
    if not video and any(f == 'tiktok' for f in formats):
        print('(no --video flag — skipping reel.mp4 render. Pass --video to synthesize your voice + stitch the Reel.)')

    # Platform preview HTML
    preview_slots = [
        {'day': 'adhoc', 'fmt': f, 'brand_id': brand_id, 'brand': brand, 'text': render(insight, brand, f)}
        for f in formats
    ]
    try:
        preview_path = build_bundle_preview(bundle_dir, preview_slots, insight)
    except Exception as e:
        print(f'(preview generation failed: {e})')
        preview_path = None

    print(f'Saved {len(all_written)} file(s) to: {bundle_dir.relative_to(ROOT)}')
    for p in all_written:
        print(f'  · {p.relative_to(bundle_dir).as_posix()}')
    if preview_path:
        print(f'\nPlatform preview: {preview_path.relative_to(ROOT)}')
        if open_browser:
            if _open_in_browser(preview_path):
                print('  → Opened in your default browser.')
            else:
                print(f'  Open manually: file:///{preview_path.resolve().as_posix()}')
        else:
            print(f'  Open manually: file:///{preview_path.resolve().as_posix()}')


def cmd_weekly(brain, brands, iid=None, save=False, open_browser=True, video=False):
    """Weekly bundle — every slot in WEEKLY_SCHEDULE, organized by brand."""
    insights = brain['insights']
    if iid:
        target = find_insight(brain, iid)
    else:
        week_num = datetime.now().isocalendar()[1]
        target = insights[week_num % len(insights)]

    print('═' * 63)
    print(f'WEEKLY CONTENT BUNDLE — {target["id"]}')
    print(f'Week of {datetime.now().strftime("%Y-%m-%d")}')
    print('═' * 63)

    # Build all slots in memory first
    slots = []
    for day, fmt, brand_id in WEEKLY_SCHEDULE:
        if brand_id not in brands:
            continue
        brand = brands[brand_id]
        text = render(target, brand, fmt)
        slots.append({'day': day, 'fmt': fmt, 'brand_id': brand_id, 'brand': brand, 'text': text})

    # Print to stdout (summary view)
    for s in slots:
        print(f'\n### {s["day"].upper()} — {s["fmt"].upper()} — {s["brand"]["name"]}')
        print(s['text'])

    if not save:
        return

    # Write folder bundle
    stamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    bundle_dir = OUTPUT_DIR / f'{stamp}_weekly_{target["id"]}'
    bundle_dir.mkdir(parents=True, exist_ok=True)

    all_written = []
    per_brand_summary = {bid: [] for bid in brands}

    for s in slots:
        written = write_slot(bundle_dir, target, s['brand_id'], s['brand'], s['day'], s['fmt'], s['text'])
        all_written.extend(written)
        per_brand_summary[s['brand_id']].append((s['day'], s['fmt']))

    # Bundle index
    index_lines = [
        f'# Weekly Bundle — {target["id"]}',
        '',
        f'**Problem**: {target["problem"]}',
        f'**Example**: {target["example"]}',
        f'**Fix**: {target["fix"]}',
        '',
        f'Generated: {datetime.now().isoformat(timespec="seconds")}',
        '',
        '## Files by brand',
    ]
    for bid in brands:
        entries = per_brand_summary.get(bid, [])
        if not entries:
            continue
        index_lines.append(f'\n### {brands[bid]["name"]} (`{bid}/`)')
        for day, fmt in entries:
            if fmt == 'carousel':
                carousel_dir = bundle_dir / bid / f'{day.lower()}_carousel'
                index_lines.append(
                    f'- `{bid}/{day.lower()}_carousel/` — carousel script + caption + 6 PNG slides'
                )
            else:
                index_lines.append(f'- `{bid}/{_slot_filename(day, fmt)}` — {fmt} ({day})')

    (bundle_dir / 'bundle.md').write_text('\n'.join(index_lines), encoding='utf-8')

    # Optional: render reel.mp4 for every tiktok slot written
    mp4_paths = _render_pending_reels() if video else []
    if not video and any(s['fmt'] == 'tiktok' for s in slots):
        print('\n(no --video flag — skipping reel.mp4 render. Pass --video to synthesize your voice + stitch every Reel.)')

    # Platform preview HTML — one page showing every slot in its actual platform UI style
    try:
        preview_path = build_bundle_preview(bundle_dir, slots, target)
    except Exception as e:
        print(f'(preview generation failed: {e})')
        preview_path = None

    print(f'\n\n✔ Saved {len(all_written)} file(s) across {len([b for b in per_brand_summary if per_brand_summary[b]])} brand folder(s):')
    print(f'  {bundle_dir.relative_to(ROOT)}')
    for bid in brands:
        entries = per_brand_summary.get(bid, [])
        if entries:
            print(f'    └── {bid}/   ({len(entries)} slot(s))')
    if preview_path:
        print(f'\nPlatform preview: {preview_path.relative_to(ROOT)}')
        if open_browser:
            if _open_in_browser(preview_path):
                print('  → Opened in your default browser.')
            else:
                print(f'  Open manually: file:///{preview_path.resolve().as_posix()}')
        else:
            print(f'  Open manually: file:///{preview_path.resolve().as_posix()}')


def main():
    parser = argparse.ArgumentParser(description='Content generator — PNG slides + folder-per-brand output.')
    parser.add_argument('--list', action='store_true', help='List all insights in content_brain.json')
    parser.add_argument('--brands', action='store_true', help='List all brands')
    parser.add_argument('--insight', help='Insight ID')
    parser.add_argument('--brand', help='Brand ID (heyroya, trp-pro, verseiq, traproyalties)')
    parser.add_argument('--format', default='all',
                        help=f'Format: {", ".join(FORMATS)} or all (default)')
    parser.add_argument('--weekly', action='store_true',
                        help='Generate weekly bundle using schedule')
    parser.add_argument('--save', action='store_true', help='Save output to output/ folder')
    parser.add_argument('--no-open', dest='open', action='store_false',
                        help='Do not auto-open preview.html in the browser (default: auto-open)')
    parser.add_argument('--video', action='store_true',
                        help='Also render reel.mp4 for every tiktok slot, using ElevenLabs voiceover. '
                             'Requires ELEVENLABS_API_KEY in .env and a cloned voice. Costs API credits.')
    parser.set_defaults(open=True)

    args = parser.parse_args()

    brain = load_json(BRAIN_PATH)
    brands = load_json(BRANDS_PATH)

    if args.list:
        cmd_list(brain)
        return

    if args.brands:
        cmd_brands(brands)
        return

    if args.weekly:
        cmd_weekly(brain, brands, iid=args.insight, save=args.save, open_browser=args.open, video=args.video)
        return

    if args.insight and args.brand:
        cmd_generate(brain, brands, args.insight, args.brand, args.format, save=args.save, open_browser=args.open, video=args.video)
        return

    parser.print_help()
    print('\nQuick start:')
    print('  python generate.py --list')
    print('  python generate.py --brands')
    print('  python generate.py --insight unmatched-isrcs --brand heyroya --format linkedin')
    print('  python generate.py --insight unmatched-isrcs --brand verseiq --format carousel --save')
    print('  python generate.py --weekly --save')


if __name__ == '__main__':
    main()
