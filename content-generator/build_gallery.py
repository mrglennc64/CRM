#!/usr/bin/env python3
"""
Build a self-contained static HTML gallery of every bundle in output/.

Output: output/gallery.html
- Open directly in your browser (no server needed).
- Text files are inlined (so Copy buttons work from file://).
- PNG slides use relative paths — browser loads them as file:// URIs.

Usage:
    python build_gallery.py
Or auto-refresh after generate:
    python generate.py --weekly --save && python build_gallery.py
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
OUTPUT_DIR = ROOT / 'output'
BRANDS_PATH = ROOT / 'brands.json'


def load_brands():
    try:
        return json.loads(BRANDS_PATH.read_text(encoding='utf-8'))
    except Exception:
        return {}


def list_bundles():
    if not OUTPUT_DIR.exists():
        return []
    bundles = [d for d in OUTPUT_DIR.iterdir() if d.is_dir()]
    bundles.sort(key=lambda d: d.name, reverse=True)
    return bundles


def read_text(p):
    try:
        return p.read_text(encoding='utf-8')
    except Exception:
        return '(unreadable)'


def bundle_data(bundle_dir):
    """Walk a bundle dir and return a structured dict for HTML rendering."""
    name = bundle_dir.name
    m = re.match(r'(\d{8})_(\d{6})_(.+)', name)
    if m:
        date = f'{m.group(1)[:4]}-{m.group(1)[4:6]}-{m.group(1)[6:8]}'
        time = f'{m.group(2)[:2]}:{m.group(2)[2:4]}:{m.group(2)[4:6]}'
        label = m.group(3)
    else:
        date, time, label = '', '', name

    brand_groups = {}
    for brand_dir in sorted(bundle_dir.iterdir()):
        if not brand_dir.is_dir():
            continue
        slots = []
        for item in sorted(brand_dir.iterdir()):
            if item.is_dir():
                # carousel
                pngs = sorted([p for p in item.iterdir() if p.suffix == '.png'])
                script = item / 'script.txt'
                caption = item / 'caption.txt'
                slots.append({
                    'type': 'carousel',
                    'name': item.name,
                    'pngs': [p.relative_to(OUTPUT_DIR).as_posix() for p in pngs],
                    'script': read_text(script) if script.exists() else '',
                    'caption': read_text(caption) if caption.exists() else '',
                })
            elif item.suffix == '.txt':
                mp3_candidate = item.with_suffix('.mp3')
                slots.append({
                    'type': 'text',
                    'name': item.name,
                    'content': read_text(item),
                    'mp3': mp3_candidate.relative_to(OUTPUT_DIR).as_posix() if mp3_candidate.exists() else None,
                })
        brand_groups[brand_dir.name] = slots

    return {'dir': name, 'date': date, 'time': time, 'label': label, 'brand_groups': brand_groups}


CSS = '''
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
    background: #0a0a0a;
    color: #e0e0e0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.5;
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
}
header {
    border-bottom: 1px solid #2a2a2a;
    padding-bottom: 16px;
    margin-bottom: 32px;
}
h1 { font-size: 26px; font-weight: 800; color: #22d3ee; letter-spacing: -0.02em; }
.sub { color: #9ca3af; font-size: 13px; margin-top: 6px; }

.bundle {
    background: #111;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
}
.bundle-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #2a2a2a;
}
.bundle-title { font-size: 18px; font-weight: 700; color: #e0e0e0; }
.bundle-meta { color: #6b7280; font-size: 12px; }

.brands-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 16px;
}
.brand-card {
    background: #0a0a0a;
    border: 1px solid #1f1f1f;
    border-radius: 10px;
    padding: 14px;
}
.brand-card h3 {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #1f1f1f;
}
.brand-heyroya h3        { color: #22d3ee; }
.brand-trp-pro h3        { color: #6366f1; }
.brand-verseiq h3        { color: #73bca8; }
.brand-traproyalties h3  { color: #5e6dff; }

.slot {
    margin-bottom: 12px;
    padding: 10px;
    background: #141414;
    border: 1px solid #222;
    border-radius: 6px;
}
.slot-name {
    font-size: 12px;
    color: #9ca3af;
    margin-bottom: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.slot-name strong { color: #e0e0e0; font-weight: 600; }
.slot-name span { font-size: 10px; color: #6b7280; }
.preview {
    font-family: 'Menlo', 'Consolas', monospace;
    font-size: 11px;
    color: #9ca3af;
    white-space: pre-wrap;
    max-height: 90px;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    padding: 6px 0;
}
.preview.expanded { max-height: none; }
.preview::after {
    content: '';
    position: absolute;
    inset: auto 0 0 0;
    height: 28px;
    background: linear-gradient(transparent, #141414);
    pointer-events: none;
}
.preview.expanded::after { display: none; }

.actions { display: flex; gap: 6px; margin-top: 6px; }
.btn {
    background: transparent;
    border: 1px solid #2a2a2a;
    color: #9ca3af;
    padding: 4px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    font-family: inherit;
}
.btn:hover { border-color: #22d3ee; color: #22d3ee; }
.btn.copied { border-color: #22c55e; color: #22c55e; }

.carousel-slot .pngs {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
    margin: 6px 0 8px;
}
.carousel-slot .pngs img {
    width: 100%;
    aspect-ratio: 1080/1350;
    object-fit: cover;
    border: 1px solid #2a2a2a;
    border-radius: 4px;
    cursor: zoom-in;
    background: #000;
}

.modal {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.92);
    z-index: 100;
    align-items: center;
    justify-content: center;
    padding: 40px;
}
.modal.open { display: flex; }
.modal img { max-width: 100%; max-height: 90vh; object-fit: contain; }
.modal-close { position: absolute; top: 20px; right: 24px; background: none; border: none; color: #fff; font-size: 32px; cursor: pointer; }

.empty { text-align: center; padding: 80px 20px; color: #6b7280; }
'''


JS = '''
const TEXT_STORE = window.__TEXTS || {};

function togglePreview(el) { el.classList.toggle('expanded'); }
function openModal(src) {
    document.getElementById('modalImg').src = src;
    document.getElementById('modal').classList.add('open');
}
function closeModal() { document.getElementById('modal').classList.remove('open'); }
async function copyKey(btn, key) {
    const text = TEXT_STORE[key];
    if (text === undefined) { alert('Missing: ' + key); return; }
    try {
        await navigator.clipboard.writeText(text);
        btn.classList.add('copied');
        const orig = btn.textContent;
        btn.textContent = '✓ copied';
        setTimeout(() => { btn.classList.remove('copied'); btn.textContent = orig; }, 1500);
    } catch (e) {
        // Fallback for file:// where clipboard API sometimes blocks
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch {}
        document.body.removeChild(ta);
        btn.classList.add('copied');
        const orig = btn.textContent;
        btn.textContent = '✓ copied';
        setTimeout(() => { btn.classList.remove('copied'); btn.textContent = orig; }, 1500);
    }
}
'''


def render_text_slot(key, slot):
    preview = html.escape(slot['content'])
    audio_html = ''
    if slot.get('mp3'):
        audio_html = (
            f'<audio controls preload="none" style="width:100%;margin-top:8px;height:32px;">'
            f'<source src="{html.escape(slot["mp3"])}" type="audio/mpeg"></audio>'
        )
    return (
        f'<div class="slot">'
        f'<div class="slot-name"><strong>{html.escape(slot["name"])}</strong>'
        f'{"<span>" + chr(127911) + " voiceover</span>" if slot.get("mp3") else ""}</div>'
        f'<div class="preview" onclick="togglePreview(this)">{preview}</div>'
        f'{audio_html}'
        f'<div class="actions">'
        f'<button class="btn" onclick="copyKey(this, \'{key}\')">copy</button>'
        f'</div>'
        f'</div>'
    )


def render_carousel_slot(bundle_dir_name, key_script, key_caption, slot):
    parts = ['<div class="slot carousel-slot">']
    parts.append(
        f'<div class="slot-name"><strong>{html.escape(slot["name"])}</strong>'
        f'<span>{len(slot["pngs"])} slides · script · caption</span></div>'
    )
    parts.append('<div class="pngs">')
    for png_rel in slot['pngs']:
        # png_rel is relative to OUTPUT_DIR (e.g. "bundle/verseiq/.../slide-1.png")
        # gallery.html lives in OUTPUT_DIR, so relative path is just png_rel
        src = html.escape(png_rel)
        parts.append(f'<img src="{src}" loading="lazy" onclick="openModal(this.src)">')
    parts.append('</div>')
    parts.append('<div class="actions">')
    parts.append(f'<button class="btn" onclick="copyKey(this, \'{key_caption}\')">copy caption</button>')
    parts.append(f'<button class="btn" onclick="copyKey(this, \'{key_script}\')">copy script</button>')
    parts.append('</div>')
    parts.append('</div>')
    return ''.join(parts)


def build(gallery_path):
    brands = load_brands()
    bundles = list_bundles()

    # We'll collect all text content into a JS object so copy buttons work offline
    texts = {}
    parts = []
    parts.append('<!DOCTYPE html>')
    parts.append('<html lang="en"><head><meta charset="UTF-8">')
    parts.append('<meta name="viewport" content="width=device-width, initial-scale=1">')
    parts.append('<title>TrapMarketing — Content Gallery</title>')
    parts.append(f'<style>{CSS}</style>')
    parts.append('</head><body>')
    parts.append('<header>')
    parts.append('<h1>TrapMarketing Content Gallery</h1>')
    parts.append(f'<div class="sub">{len(bundles)} bundle(s) · newest first · open any file via right-click → Show in Explorer</div>')
    parts.append('</header>')

    if not bundles:
        parts.append('<div class="empty">No bundles yet. Run <code>python generate.py --weekly --save</code>, then re-run this script.</div>')
    else:
        for b in bundles:
            data = bundle_data(b)
            parts.append('<div class="bundle">')
            parts.append('<div class="bundle-header">')
            parts.append(f'<div class="bundle-title">{html.escape(data["label"])}</div>')
            parts.append(f'<div class="bundle-meta">{html.escape(data["date"])} {html.escape(data["time"])}</div>')
            parts.append('</div>')

            if not data['brand_groups']:
                parts.append('<div class="sub">(empty)</div>')
            else:
                parts.append('<div class="brands-grid">')
                for brand_id, slots in data['brand_groups'].items():
                    brand_info = brands.get(brand_id, {'name': brand_id})
                    parts.append(f'<div class="brand-card brand-{html.escape(brand_id)}">')
                    parts.append(f'<h3>{html.escape(brand_info.get("name", brand_id))}</h3>')

                    for idx, slot in enumerate(slots):
                        if slot['type'] == 'text':
                            key = f't_{data["dir"]}_{brand_id}_{idx}'
                            texts[key] = slot['content']
                            parts.append(render_text_slot(key, slot))
                        else:
                            key_script = f's_{data["dir"]}_{brand_id}_{idx}_script'
                            key_caption = f's_{data["dir"]}_{brand_id}_{idx}_caption'
                            texts[key_script] = slot.get('script', '')
                            texts[key_caption] = slot.get('caption', '')
                            parts.append(render_carousel_slot(data['dir'], key_script, key_caption, slot))

                    parts.append('</div>')
                parts.append('</div>')

            parts.append('</div>')

    # Embed the texts as a JS object (JSON-safe dump)
    texts_json = json.dumps(texts, ensure_ascii=False)
    parts.append(f'<script>window.__TEXTS = {texts_json};</script>')
    parts.append(f'<script>{JS}</script>')

    parts.append('<div id="modal" class="modal" onclick="closeModal()">')
    parts.append('<button class="modal-close">&times;</button>')
    parts.append('<img id="modalImg" src="">')
    parts.append('</div>')

    parts.append('</body></html>')

    gallery_path.write_text('\n'.join(parts), encoding='utf-8')
    print(f'Wrote {gallery_path} ({len(bundles)} bundle(s))')
    print(f'Open in browser: file:///{gallery_path.resolve().as_posix()}')


def main():
    OUTPUT_DIR.mkdir(exist_ok=True)
    gallery = OUTPUT_DIR / 'gallery.html'
    build(gallery)


if __name__ == '__main__':
    main()
