"""
Platform-realistic HTML preview for generated content bundles.

Writes a single self-contained `preview.html` at the root of a bundle directory.
Opening it in any browser shows each slot rendered in the actual visual style of
its target platform:

  - linkedin  → LinkedIn post card (avatar + name + "1h" + body + engagement bar)
  - carousel  → Instagram feed post with swipeable slide gallery
  - tiktok    → Vertical phone frame with caption overlay
  - threads   → Meta Threads post card
  - twitter   → X / Twitter tweet thread

Each card shows the platform's character limit so you can spot content that's too long.

No external CDN calls — all CSS inline, PNGs referenced by relative path.
"""
from __future__ import annotations
from html import escape
from pathlib import Path


# Character limits per platform (for the footer counter).
CHAR_LIMITS = {
    'linkedin': 3000,
    'tiktok':   2200,
    'carousel': 2200,
    'threads':  500,
    'twitter':  280,
}


def _body_only(text: str) -> str:
    """Strip template banner/footer lines (====== and 'Tone: ...' lines) for a clean preview."""
    lines = text.splitlines()
    cleaned = []
    seen_banner = 0
    for line in lines:
        if line.startswith('======'):
            seen_banner += 1
            continue
        # Skip the title line immediately after the first banner
        if seen_banner == 1 and line.strip().endswith(('— ' + line.split('—')[-1].strip(),)):
            seen_banner = 2
            continue
        # Skip trailing "Tone:", "Length:", "Target:", "Caption:", "Design:" meta lines
        if line.strip().lower().startswith((
            'tone:', 'length:', 'target:', 'caption:', 'design:'
        )):
            continue
        cleaned.append(line)
    # Collapse leading/trailing blank lines
    text = '\n'.join(cleaned).strip()
    return text


def _initials(name: str) -> str:
    parts = [p for p in name.split() if p]
    if not parts:
        return '?'
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


# ----------------------------- per-platform renderers -----------------------------

def _linkedin_card(slot: dict) -> str:
    brand = slot['brand']
    body = _body_only(slot['text'])
    char_count = len(body)
    limit = CHAR_LIMITS['linkedin']
    over = char_count > limit
    palette = brand.get('palette', {})
    accent = palette.get('accent', '#0A66C2')

    return f"""
<div class="li-post">
  <div class="li-header">
    <div class="li-avatar" style="background:{accent}">{_initials(brand['name'])}</div>
    <div class="li-author">
      <div class="li-name">{escape(brand['name'])}</div>
      <div class="li-meta">{escape(brand['url'])} · now</div>
    </div>
  </div>
  <div class="li-body">{_linkify(escape(body))}</div>
  <div class="li-engagement">
    <span>👍 Like</span><span>💬 Comment</span><span>🔁 Repost</span><span>📤 Send</span>
  </div>
  <div class="char-count {'over' if over else ''}">{char_count} / {limit} chars</div>
</div>
"""


def _linkify(text: str) -> str:
    """Very light "linkify" — swap newlines for <br>, keep URLs inline."""
    return text.replace('\n\n', '<br><br>').replace('\n', '<br>')


def _ig_carousel_card(slot: dict, bundle_root: Path) -> str:
    brand = slot['brand']
    # Find PNGs for this carousel
    carousel_dir = bundle_root / slot['brand_id'] / f'{slot["day"].lower()}_carousel'
    slide_paths = sorted(carousel_dir.glob('slide-*.png'))
    slides_html = ''
    for i, p in enumerate(slide_paths):
        rel = p.relative_to(bundle_root).as_posix()
        slides_html += f'<div class="ig-slide"><img src="{escape(rel)}" alt="slide {i+1}"></div>'

    caption_path = carousel_dir / 'caption.txt'
    caption = caption_path.read_text(encoding='utf-8') if caption_path.exists() else ''
    char_count = len(caption)
    limit = CHAR_LIMITS['carousel']
    over = char_count > limit

    palette = brand.get('palette', {})
    accent = palette.get('accent', '#E1306C')

    return f"""
<div class="ig-post">
  <div class="ig-header">
    <div class="ig-avatar" style="background:{accent}">{_initials(brand['name'])}</div>
    <div class="ig-username">{escape(brand['url'].split('.')[0])}</div>
    <div class="ig-menu">⋯</div>
  </div>
  <div class="ig-carousel-wrap">
    <div class="ig-carousel-track">{slides_html}</div>
    <div class="ig-dots">
      {''.join(f'<span class="ig-dot{" active" if i==0 else ""}"></span>' for i in range(len(slide_paths)))}
    </div>
  </div>
  <div class="ig-actions">
    <span>♡</span><span>💬</span><span>↗</span><span style="margin-left:auto">🔖</span>
  </div>
  <div class="ig-caption"><strong>{escape(brand['url'].split('.')[0])}</strong> {escape(caption[:300])}{'…' if len(caption) > 300 else ''}</div>
  <div class="char-count {'over' if over else ''}">{char_count} / {limit} chars (caption)</div>
</div>
"""


def _tiktok_card(slot: dict, bundle_root: Path) -> str:
    brand = slot['brand']
    body = _body_only(slot['text'])
    # Pull the HOOK line for fallback on-screen text
    hook = ''
    for line in body.splitlines():
        if line.strip() and not line.lower().startswith(('hook', 'pain', 'real example', 'fix', 'cta')):
            hook = line.strip()
            break
    if not hook:
        content_lines = [ln for ln in body.splitlines() if ln.strip() and not ln.endswith(':')]
        hook = content_lines[0] if content_lines else '(no hook)'

    char_count = len(body)
    limit = CHAR_LIMITS['tiktok']
    over = char_count > limit

    palette = brand.get('palette', {})
    accent = palette.get('accent', '#FE2C55')

    # Look for generated beat PNGs: <brand_id>/<day>_tiktok/beat-N.png
    reel_dir = bundle_root / slot['brand_id'] / f'{slot["day"].lower()}_tiktok'
    beat_paths = sorted(reel_dir.glob('beat-*.png'))
    mp4_path = reel_dir / 'reel.mp4'

    if mp4_path.exists():
        # Finished MP4 — embed the video player
        rel = mp4_path.relative_to(bundle_root).as_posix()
        phone_content = (
            f'<video class="tt-beat-fullframe" src="{escape(rel)}" '
            f'controls playsinline preload="metadata" loop></video>'
        )
    elif beat_paths:
        first_rel = beat_paths[0].relative_to(bundle_root).as_posix()
        phone_content = f'<img class="tt-beat-fullframe" src="{escape(first_rel)}" alt="hook beat">'
    else:
        phone_content = f'<div class="tt-hook">{escape(hook)}</div>'

    # Thumbnail strip of all 5 beats (shown below the phone)
    strip_html = ''
    if beat_paths:
        thumbs = ''
        for i, p in enumerate(beat_paths):
            rel = p.relative_to(bundle_root).as_posix()
            thumbs += f'<a class="tt-thumb" href="{escape(rel)}" target="_blank"><img src="{escape(rel)}" alt="beat {i+1}"><span>{i+1}</span></a>'
        strip_html = f'<div class="tt-thumbstrip">{thumbs}</div>'

    # Shotlist + MP4 links below the phone
    shotlist_path = reel_dir / 'reel-shotlist.md'
    links_html = ''
    if mp4_path.exists():
        rel = mp4_path.relative_to(bundle_root).as_posix()
        links_html += f'<a class="tt-shotlist-link" href="{escape(rel)}" download>⬇ Download reel.mp4</a> '
    if shotlist_path.exists():
        rel = shotlist_path.relative_to(bundle_root).as_posix()
        links_html += f'<a class="tt-shotlist-link" href="{escape(rel)}" target="_blank">📋 Shot list</a>'
    shotlist_link = links_html

    return f"""
<div class="tt-phone">
  <div class="tt-screen">
    <div class="tt-overlay-top">
      <span>Following</span><span class="tt-active">For You</span>
    </div>
    {phone_content}
    <div class="tt-right-rail">
      <div class="tt-icon" style="background:{accent}">{_initials(brand['name'])}</div>
      <div class="tt-count">♡ 12.4K</div>
      <div class="tt-count">💬 438</div>
      <div class="tt-count">↗ 1.2K</div>
    </div>
    <div class="tt-bottom">
      <div class="tt-username">@{escape(brand['url'].split('.')[0])}</div>
      <div class="tt-caption">{escape(hook)} — {escape(brand['url'])}</div>
    </div>
  </div>
</div>
{strip_html}
{shotlist_link}
<details class="tt-script">
  <summary>Full Reel/TikTok script</summary>
  <pre>{escape(body)}</pre>
</details>
<div class="char-count {'over' if over else ''}">{char_count} / {limit} chars (script)</div>
"""


def _threads_card(slot: dict) -> str:
    brand = slot['brand']
    body = _body_only(slot['text'])
    char_count = len(body)
    limit = CHAR_LIMITS['threads']
    over = char_count > limit
    palette = brand.get('palette', {})
    accent = palette.get('accent', '#000')

    return f"""
<div class="th-post">
  <div class="th-avatar" style="background:{accent}">{_initials(brand['name'])}</div>
  <div class="th-body">
    <div class="th-header"><strong>{escape(brand['url'].split('.')[0])}</strong> <span>· now</span></div>
    <div class="th-text">{_linkify(escape(body))}</div>
    <div class="th-actions">
      <span>♡</span><span>💬</span><span>🔁</span><span>↗</span>
    </div>
  </div>
</div>
<div class="char-count {'over' if over else ''}">{char_count} / {limit} chars</div>
"""


def _twitter_card(slot: dict) -> str:
    brand = slot['brand']
    body = _body_only(slot['text'])
    # Split into tweets if "1/", "2/", "3/" are present
    tweets = []
    cur = []
    for line in body.splitlines():
        if line.strip().startswith(('1/', '2/', '3/', '4/', '5/')):
            if cur:
                tweets.append('\n'.join(cur).strip())
                cur = []
            cur.append(line)
        else:
            cur.append(line)
    if cur:
        tweets.append('\n'.join(cur).strip())
    if not tweets:
        tweets = [body]

    palette = brand.get('palette', {})
    accent = palette.get('accent', '#1DA1F2')
    limit = CHAR_LIMITS['twitter']

    tweets_html = ''
    for i, t in enumerate(tweets):
        ct = len(t)
        over = ct > limit
        tweets_html += f"""
<div class="tw-tweet">
  <div class="tw-avatar" style="background:{accent}">{_initials(brand['name'])}</div>
  <div class="tw-body">
    <div class="tw-header"><strong>{escape(brand['name'])}</strong> <span>@{escape(brand['url'].split('.')[0])} · now</span></div>
    <div class="tw-text">{_linkify(escape(t))}</div>
    <div class="tw-actions"><span>💬</span><span>🔁</span><span>♡</span><span>📊</span></div>
    <div class="char-count {'over' if over else ''}">{ct} / {limit} chars</div>
  </div>
</div>
"""
    return tweets_html


# ----------------------------- master builder -----------------------------

PLATFORM_ORDER = ['linkedin', 'carousel', 'tiktok', 'threads', 'twitter']
PLATFORM_LABELS = {
    'linkedin': 'LinkedIn',
    'carousel': 'Instagram Carousel',
    'tiktok':   'TikTok / IG Reel',
    'threads':  'Threads',
    'twitter':  'X / Twitter',
}


STYLES = """
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, Roboto, Helvetica, Arial, sans-serif; background: #0f1115; color: #e7e9ee; }
.wrap { max-width: 1400px; margin: 0 auto; padding: 32px 24px 120px; }
h1 { font-size: 28px; margin: 0 0 8px; font-weight: 700; letter-spacing: -0.01em; }
.lede { color: #9aa0a8; font-size: 14px; margin-bottom: 32px; }
h2 { font-size: 15px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #7a82a0; margin: 40px 0 16px; border-bottom: 1px solid #1f2431; padding-bottom: 10px; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 24px; }
.slot { background: #17192180; border: 1px solid #252a3a; border-radius: 14px; padding: 20px; }
.slot .day { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #7a82a0; margin-bottom: 10px; }
.slot .brand-line { font-size: 12px; color: #9aa0a8; margin-bottom: 14px; }
.slot .brand-line strong { color: #e7e9ee; }

.char-count { font-size: 11px; color: #7a82a0; text-align: right; margin-top: 8px; font-variant-numeric: tabular-nums; }
.char-count.over { color: #f43f5e; font-weight: 700; }

/* ---------- LinkedIn ---------- */
.li-post { background: #fff; color: #000; border-radius: 8px; padding: 14px 16px; font-size: 14px; line-height: 1.45; border: 1px solid #e0e0e0; }
.li-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.li-avatar { width: 44px; height: 44px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px; }
.li-name { font-weight: 700; font-size: 14px; }
.li-meta { font-size: 12px; color: #666; }
.li-body { white-space: pre-wrap; margin: 8px 0 12px; font-size: 14px; }
.li-engagement { display: flex; gap: 18px; padding-top: 10px; border-top: 1px solid #eee; color: #666; font-size: 13px; }
.li-post .char-count { color: #888; }

/* ---------- Instagram carousel ---------- */
.ig-post { background: #fff; color: #000; border-radius: 8px; overflow: hidden; font-size: 14px; border: 1px solid #dbdbdb; }
.ig-header { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-bottom: 1px solid #efefef; }
.ig-avatar { width: 32px; height: 32px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; }
.ig-username { font-weight: 700; font-size: 13px; flex: 1; }
.ig-menu { font-size: 20px; color: #666; letter-spacing: 2px; }
.ig-carousel-wrap { position: relative; background: #000; }
.ig-carousel-track { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; }
.ig-slide { flex: 0 0 100%; scroll-snap-align: start; }
.ig-slide img { width: 100%; display: block; }
.ig-dots { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 4px; }
.ig-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.4); }
.ig-dot.active { background: #0095f6; }
.ig-actions { display: flex; gap: 14px; padding: 10px 12px 6px; font-size: 20px; }
.ig-caption { padding: 0 12px 12px; font-size: 13px; line-height: 1.4; white-space: pre-wrap; }
.ig-post .char-count { padding: 0 12px 10px; color: #888; }

/* ---------- TikTok ---------- */
.tt-phone { width: 320px; height: 568px; background: #000; border-radius: 28px; padding: 10px; position: relative; box-shadow: 0 6px 30px rgba(0,0,0,0.5); margin: 0 auto; }
.tt-screen { background: linear-gradient(180deg, #111, #000); border-radius: 20px; width: 100%; height: 100%; position: relative; color: #fff; overflow: hidden; padding: 12px; display: flex; flex-direction: column; }
.tt-overlay-top { display: flex; justify-content: center; gap: 20px; font-size: 14px; color: #bbb; padding: 4px 0 12px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.tt-overlay-top .tt-active { color: #fff; font-weight: 700; position: relative; }
.tt-overlay-top .tt-active::after { content: ''; position: absolute; bottom: -12px; left: 0; right: 0; height: 2px; background: #fff; }
.tt-hook { flex: 1; display: flex; align-items: center; justify-content: center; text-align: center; font-weight: 800; font-size: 22px; padding: 20px; text-shadow: 0 2px 10px rgba(0,0,0,0.6); }
.tt-right-rail { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 14px; align-items: center; }
.tt-icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px; }
.tt-count { font-size: 11px; opacity: 0.9; }
.tt-bottom { padding: 0 8px 4px; }
.tt-username { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
.tt-caption { font-size: 12px; line-height: 1.4; opacity: 0.9; }
.tt-script { margin-top: 14px; background: #1a1f2e; border-radius: 8px; padding: 10px 14px; border: 1px solid #252a3a; }
.tt-script summary { cursor: pointer; font-size: 12px; color: #9aa0a8; user-select: none; }
.tt-script pre { margin: 10px 0 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; white-space: pre-wrap; line-height: 1.5; color: #c9cfdb; }
.tt-beat-fullframe { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.tt-phone .tt-overlay-top, .tt-phone .tt-right-rail, .tt-phone .tt-bottom { position: relative; z-index: 2; }
.tt-phone .tt-overlay-top { background: linear-gradient(180deg, rgba(0,0,0,0.5), transparent); }
.tt-phone .tt-bottom { background: linear-gradient(0deg, rgba(0,0,0,0.7), transparent); padding: 30px 8px 4px; position: absolute; bottom: 0; left: 0; right: 0; }
.tt-thumbstrip { display: flex; gap: 6px; margin-top: 12px; overflow-x: auto; padding-bottom: 4px; }
.tt-thumb { position: relative; flex: 0 0 54px; width: 54px; height: 96px; border-radius: 6px; overflow: hidden; border: 1px solid #252a3a; display: block; }
.tt-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.tt-thumb span { position: absolute; bottom: 3px; right: 4px; font-size: 10px; background: rgba(0,0,0,0.6); color: #fff; padding: 1px 5px; border-radius: 4px; }
.tt-shotlist-link { display: inline-block; margin-top: 10px; font-size: 12px; color: #7a82a0; text-decoration: none; background: #1a1f2e; padding: 6px 12px; border-radius: 6px; border: 1px solid #252a3a; }
.tt-shotlist-link:hover { color: #e7e9ee; }

/* ---------- Threads ---------- */
.th-post { display: flex; gap: 12px; background: #fff; color: #000; border-radius: 14px; padding: 14px 16px; border: 1px solid #e5e5e5; }
.th-avatar { width: 40px; height: 40px; border-radius: 50%; flex: 0 0 40px; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
.th-body { flex: 1; }
.th-header { font-size: 14px; margin-bottom: 4px; }
.th-header span { color: #999; font-weight: 400; }
.th-text { font-size: 14px; line-height: 1.45; white-space: pre-wrap; margin-bottom: 10px; }
.th-actions { display: flex; gap: 20px; color: #666; font-size: 18px; }
.th-post + .char-count { color: #888; }

/* ---------- Twitter ---------- */
.tw-tweet { display: flex; gap: 12px; background: #fff; color: #000; border-radius: 14px; padding: 12px 14px; border: 1px solid #e5e5e5; margin-bottom: 10px; }
.tw-avatar { width: 40px; height: 40px; border-radius: 50%; flex: 0 0 40px; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
.tw-body { flex: 1; }
.tw-header { font-size: 14px; margin-bottom: 4px; }
.tw-header span { color: #536471; font-weight: 400; }
.tw-text { font-size: 15px; line-height: 1.4; white-space: pre-wrap; margin-bottom: 8px; }
.tw-actions { display: flex; gap: 28px; color: #536471; font-size: 15px; padding-top: 4px; }
.tw-tweet .char-count { color: #888; }

/* top summary strip */
.summary { background: #1a1f2e; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; border: 1px solid #252a3a; }
.summary strong { color: #fff; }
.summary .problem { color: #fff; font-size: 15px; font-weight: 600; margin-bottom: 6px; }
.summary .meta-row { font-size: 13px; color: #9aa0a8; margin-top: 4px; }
"""


def build_bundle_preview(bundle_dir: Path, slots: list, insight: dict) -> Path:
    """
    Write a single `preview.html` at bundle_dir root.
    `slots` = list of dicts: {day, fmt, brand_id, brand, text}
    Returns path to the written HTML.
    """
    # Group slots by format for readable section layout
    by_fmt = {}
    for s in slots:
        by_fmt.setdefault(s['fmt'], []).append(s)

    sections_html = ''
    for fmt in PLATFORM_ORDER:
        entries = by_fmt.get(fmt, [])
        if not entries:
            continue
        cards_html = ''
        for s in entries:
            card_body = ''
            if fmt == 'linkedin':
                card_body = _linkedin_card(s)
            elif fmt == 'carousel':
                card_body = _ig_carousel_card(s, bundle_dir)
            elif fmt == 'tiktok':
                card_body = _tiktok_card(s, bundle_dir)
            elif fmt == 'threads':
                card_body = _threads_card(s)
            elif fmt == 'twitter':
                card_body = _twitter_card(s)

            brand = s['brand']
            cards_html += f"""
<div class="slot">
  <div class="day">{escape(s['day']).upper()}</div>
  <div class="brand-line"><strong>{escape(brand['name'])}</strong> · {escape(brand['url'])}</div>
  {card_body}
</div>
"""
        sections_html += f"""
<h2>{PLATFORM_LABELS[fmt]}</h2>
<div class="grid">{cards_html}</div>
"""

    summary = f"""
<div class="summary">
  <div class="problem">{escape(insight.get('problem', ''))}</div>
  <div class="meta-row"><strong>Example:</strong> {escape(insight.get('example', ''))}</div>
  <div class="meta-row"><strong>Impact:</strong> {escape(insight.get('impact', ''))}</div>
  <div class="meta-row"><strong>Fix:</strong> {escape(insight.get('fix', ''))}</div>
</div>
"""

    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Platform Preview — {escape(insight.get('id', ''))}</title>
<style>{STYLES}</style>
</head>
<body>
<div class="wrap">
  <h1>Platform preview — {escape(insight.get('id', ''))}</h1>
  <p class="lede">How each post will look on the platform it's going to. Red counter = over character limit.</p>
  {summary}
  {sections_html}
</div>
</body>
</html>
"""

    out = bundle_dir / 'preview.html'
    out.write_text(html, encoding='utf-8')
    return out
