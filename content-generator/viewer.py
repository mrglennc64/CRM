#!/usr/bin/env python3
"""
TrapMarketing viewer — local web UI to browse generated content bundles.

Starts a tiny local server that serves `output/` with a nice index:
- Lists all bundle folders (newest first)
- Shows each bundle's brands, insight, files
- Previews .txt files inline
- Previews .png slides with click-to-zoom
- Copy-to-clipboard buttons for every text block

Usage:
    python viewer.py               # starts on http://127.0.0.1:5173
    python viewer.py --port 8080   # custom port

No extra dependencies — uses Python stdlib http.server.
"""
import argparse
import html
import json
import re
import sys
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).parent
OUTPUT_DIR = ROOT / 'output'
BRANDS_PATH = ROOT / 'brands.json'
BRAIN_PATH = ROOT / 'content_brain.json'


def load_brands():
    try:
        return json.loads(BRANDS_PATH.read_text(encoding='utf-8'))
    except Exception:
        return {}


def load_brain():
    try:
        return json.loads(BRAIN_PATH.read_text(encoding='utf-8'))
    except Exception:
        return {'insights': []}


def list_bundles():
    """Return list of bundle dirs sorted newest first."""
    if not OUTPUT_DIR.exists():
        return []
    bundles = [d for d in OUTPUT_DIR.iterdir() if d.is_dir()]
    bundles.sort(key=lambda d: d.name, reverse=True)
    return bundles


def bundle_summary(bundle_dir, brands):
    """Parse a bundle dir → structured summary for the UI."""
    name = bundle_dir.name
    # Parse: 20260424_170920_weekly_unmatched-isrcs  OR  20260424_170920_unmatched-isrcs_verseiq
    m = re.match(r'(\d{8})_(\d{6})_(.+)', name)
    if m:
        date_str = f'{m.group(1)[:4]}-{m.group(1)[4:6]}-{m.group(1)[6:8]}'
        time_str = f'{m.group(2)[:2]}:{m.group(2)[2:4]}:{m.group(2)[4:6]}'
        rest = m.group(3)
    else:
        date_str, time_str, rest = '', '', name

    # Per-brand groups
    brand_groups = {}
    for brand_dir in sorted(bundle_dir.iterdir()):
        if not brand_dir.is_dir():
            continue
        slots = []
        for item in sorted(brand_dir.iterdir()):
            if item.is_dir():
                # Carousel folder
                pngs = sorted([p.name for p in item.iterdir() if p.suffix == '.png'])
                slots.append({
                    'type': 'carousel',
                    'name': item.name,
                    'script_path': (item / 'script.txt').relative_to(bundle_dir).as_posix() if (item / 'script.txt').exists() else None,
                    'caption_path': (item / 'caption.txt').relative_to(bundle_dir).as_posix() if (item / 'caption.txt').exists() else None,
                    'png_paths': [
                        (item / p).relative_to(bundle_dir).as_posix() for p in pngs
                    ],
                })
            elif item.suffix == '.txt':
                slots.append({
                    'type': 'text',
                    'name': item.name,
                    'path': item.relative_to(bundle_dir).as_posix(),
                })
        brand_groups[brand_dir.name] = slots

    return {
        'dir_name': name,
        'date': date_str,
        'time': time_str,
        'label': rest,
        'brand_groups': brand_groups,
    }


HTML_HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>TrapMarketing — Content Viewer</title>
<style>
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
    display: flex;
    justify-content: space-between;
    align-items: center;
}
h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: #22d3ee; }
h1 a { color: inherit; text-decoration: none; }
.sub { color: #9ca3af; font-size: 13px; margin-top: 4px; }
.refresh { color: #9ca3af; text-decoration: none; font-size: 13px; padding: 6px 12px; border: 1px solid #2a2a2a; border-radius: 6px; }
.refresh:hover { color: #22d3ee; border-color: #22d3ee; }

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
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 16px;
}
.brand-card {
    background: #0a0a0a;
    border: 1px solid #1f1f1f;
    border-radius: 10px;
    padding: 14px;
}
.brand-card h3 {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #1f1f1f;
}
.brand-heyroya h3        { color: #22d3ee; }
.brand-trp-pro h3        { color: #6366f1; }
.brand-verseiq h3        { color: #73bca8; }
.brand-traproyalties h3  { color: #5e6dff; }

.slot {
    margin-bottom: 10px;
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
.slot-preview {
    font-size: 12px;
    color: #9ca3af;
    max-height: 80px;
    overflow: hidden;
    position: relative;
    white-space: pre-wrap;
    font-family: 'Menlo', 'Consolas', monospace;
}
.slot-preview.expanded { max-height: none; }
.slot-preview::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 30px;
    background: linear-gradient(transparent, #141414);
    pointer-events: none;
}
.slot-preview.expanded::after { display: none; }
.slot-actions {
    display: flex;
    gap: 6px;
    margin-top: 6px;
    font-size: 11px;
}
.btn {
    background: transparent;
    border: 1px solid #2a2a2a;
    color: #9ca3af;
    padding: 4px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    text-decoration: none;
    font-family: inherit;
}
.btn:hover { border-color: #22d3ee; color: #22d3ee; }
.btn.copied { border-color: #22c55e; color: #22c55e; }

.carousel-slot .pngs {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
    margin-top: 8px;
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

/* Modal */
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
.modal-close { position: absolute; top: 20px; right: 24px; color: #fff; font-size: 32px; cursor: pointer; background: none; border: none; }

.empty {
    text-align: center;
    padding: 80px 20px;
    color: #6b7280;
}
.empty a { color: #22d3ee; }
</style>
</head>
<body>
<header>
    <div>
        <h1><a href="/">TrapMarketing Content Viewer</a></h1>
        <div class="sub">Local preview · nothing posts · every asset is a file you can open</div>
    </div>
    <a href="/" class="refresh">↻ Refresh</a>
</header>
"""

HTML_TAIL = """
<div id="modal" class="modal" onclick="closeModal()">
    <button class="modal-close">&times;</button>
    <img id="modalImg" src="">
</div>
<script>
function openModal(src) {
    document.getElementById('modalImg').src = src;
    document.getElementById('modal').classList.add('open');
}
function closeModal() {
    document.getElementById('modal').classList.remove('open');
}
function togglePreview(el) {
    el.classList.toggle('expanded');
}
async function copyText(btn, path) {
    try {
        const r = await fetch('/file?p=' + encodeURIComponent(path));
        const text = await r.text();
        await navigator.clipboard.writeText(text);
        btn.classList.add('copied');
        btn.textContent = '✓ copied';
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.textContent = 'copy';
        }, 1500);
    } catch (e) {
        alert('Copy failed: ' + e.message);
    }
}
</script>
</body>
</html>
"""


def render_index(bundles, brands):
    parts = [HTML_HEAD]

    if not bundles:
        parts.append('<div class="empty">No bundles yet. Run <code>python generate.py --weekly --save</code> to create one.</div>')
        parts.append(HTML_TAIL)
        return ''.join(parts)

    parts.append(f'<div class="sub" style="margin-bottom: 16px;">{len(bundles)} bundle(s) · newest first</div>')

    for b in bundles:
        summary = bundle_summary(b, brands)
        parts.append('<div class="bundle">')
        parts.append('<div class="bundle-header">')
        parts.append(f'<div class="bundle-title">{html.escape(summary["label"])}</div>')
        parts.append(f'<div class="bundle-meta">{summary["date"]} {summary["time"]}</div>')
        parts.append('</div>')

        if not summary['brand_groups']:
            parts.append('<div class="sub">(empty)</div>')
        else:
            parts.append('<div class="brands-grid">')
            for brand_id, slots in summary['brand_groups'].items():
                brand_info = brands.get(brand_id, {'name': brand_id, 'url': ''})
                parts.append(f'<div class="brand-card brand-{html.escape(brand_id)}">')
                parts.append(f'<h3>{html.escape(brand_info.get("name", brand_id))}</h3>')

                for slot in slots:
                    parts.append(render_slot(b, slot))

                parts.append('</div>')
            parts.append('</div>')

        parts.append('</div>')

    parts.append(HTML_TAIL)
    return ''.join(parts)


def render_slot(bundle_dir, slot):
    if slot['type'] == 'text':
        path = bundle_dir / slot['path']
        try:
            preview = path.read_text(encoding='utf-8')
        except Exception:
            preview = '(unreadable)'
        file_url = f'/file?p={urllib.parse.quote(f"{bundle_dir.name}/{slot['path']}")}'
        return (
            f'<div class="slot">'
            f'<div class="slot-name"><strong>{html.escape(slot["name"])}</strong></div>'
            f'<div class="slot-preview" onclick="togglePreview(this)">{html.escape(preview)}</div>'
            f'<div class="slot-actions">'
            f'<button class="btn" onclick="copyText(this, \'{html.escape(bundle_dir.name)}/{html.escape(slot["path"])}\')">copy</button>'
            f'<a class="btn" href="{file_url}" target="_blank">open</a>'
            f'</div>'
            f'</div>'
        )

    # carousel
    parts = ['<div class="slot carousel-slot">']
    parts.append(f'<div class="slot-name"><strong>{html.escape(slot["name"])}</strong> <span>6 slides + script + caption</span></div>')

    parts.append('<div class="pngs">')
    for p in slot['png_paths']:
        img_url = f'/file?p={urllib.parse.quote(f"{bundle_dir.name}/{p}")}'
        parts.append(f'<img src="{img_url}" loading="lazy" onclick="openModal(this.src)">')
    parts.append('</div>')

    actions = ['<div class="slot-actions">']
    if slot.get('caption_path'):
        actions.append(f'<button class="btn" onclick="copyText(this, \'{html.escape(bundle_dir.name)}/{html.escape(slot["caption_path"])}\')">copy caption</button>')
    if slot.get('script_path'):
        actions.append(f'<button class="btn" onclick="copyText(this, \'{html.escape(bundle_dir.name)}/{html.escape(slot["script_path"])}\')">copy script</button>')
    actions.append('</div>')
    parts.append(''.join(actions))

    parts.append('</div>')
    return ''.join(parts)


class ViewerHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)

        if parsed.path == '/' or parsed.path == '':
            brands = load_brands()
            bundles = list_bundles()
            body = render_index(bundles, brands).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if parsed.path == '/file':
            rel = qs.get('p', [''])[0]
            # Prevent path traversal
            target = (OUTPUT_DIR / rel).resolve()
            try:
                target.relative_to(OUTPUT_DIR.resolve())
            except ValueError:
                self.send_error(403, 'Forbidden')
                return
            if not target.is_file():
                self.send_error(404, 'Not found')
                return
            ctype = 'text/plain; charset=utf-8' if target.suffix == '.txt' else (
                'image/png' if target.suffix == '.png' else 'application/octet-stream'
            )
            if target.suffix == '.md':
                ctype = 'text/markdown; charset=utf-8'
            data = target.read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        self.send_error(404, 'Not found')

    def log_message(self, format, *args):
        # Quieter output
        pass


def main():
    parser = argparse.ArgumentParser(description='Local viewer for TrapMarketing content bundles.')
    parser.add_argument('--port', type=int, default=5173)
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--no-browser', action='store_true', help="Don't auto-open browser")
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), ViewerHandler)
    url = f'http://{args.host}:{args.port}/'
    print(f'TrapMarketing viewer running at {url}')
    print('Press Ctrl+C to stop.')

    if not args.no_browser:
        try:
            webbrowser.open(url)
        except Exception:
            pass

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down.')
        server.shutdown()


if __name__ == '__main__':
    main()
