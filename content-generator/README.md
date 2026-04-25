# Content Generator

Takes one **insight** (problem/impact/example/fix) and generates content across your brands:

1. TikTok / IG Reel script
2. IG Carousel (6 slides **as actual PNG images**)
3. LinkedIn post
4. Threads post
5. X / Twitter thread

**Output is folder-per-brand.** Every weekly bundle lands in its own timestamped folder, with a subfolder per brand. Carousel slots produce a mini-folder containing the 6 rendered PNG slides, a short IG caption, and the full text breakdown.

**Every bundle also ships with a `preview.html`** — open it in any browser to see each post rendered in its actual platform UI: LinkedIn post card, Instagram carousel with swipe dots, TikTok vertical phone frame, Threads card, X/Twitter thread. Character limits are shown per post (red if over). No posting — pure preview.

## Files

| File | Purpose |
|------|---------|
| `generate.py` | CLI entry point |
| `preview_html.py` | Builds `preview.html` — platform-realistic visual preview per bundle |
| `content_brain.json` | Your insight database |
| `brands.json` | Brand config — **now includes color palettes** for PNG rendering |
| `templates/*.txt` | Format templates with `{placeholders}` |
| `fonts/` | Drop Inter `.ttf` files here for branded PNGs (falls back to system fonts if missing) |
| `requirements.txt` | Python deps (Pillow) |
| `output/` | Saved bundles (timestamped folders) |

## Install

```bash
cd content-generator
python -m pip install -r requirements.txt
```

This pulls **Pillow** (image library) — required for PNG carousel rendering. Text-only formats work without it.

### Fonts (optional but recommended)

For the PNG slides to look branded, drop Inter `.ttf` files into `fonts/`:

- `Inter-Regular.ttf`, `Inter-Medium.ttf`, `Inter-SemiBold.ttf`, `Inter-Bold.ttf`, `Inter-ExtraBold.ttf`, `Inter-Black.ttf`
- Download: https://fonts.google.com/specimen/Inter → "Download family" → unzip → copy those six weights

If missing, the renderer falls back to Arial Bold and finally Pillow's default — PNGs will still generate, just less on-brand.

## Quick start

```bash
# List all insights
python generate.py --list

# List all 4 brands
python generate.py --brands

# Print one LinkedIn post for HeyRoya (stdout)
python generate.py --insight unmatched-isrcs --brand heyroya --format linkedin

# Generate a carousel for VerseIQ AS A FOLDER OF PNGs
python generate.py --insight unmatched-isrcs --brand verseiq --format carousel --save
# → output/<stamp>_unmatched-isrcs_verseiq/verseiq/adhoc_carousel/slide-1.png ... slide-6.png + caption.txt + script.txt

# All formats for one brand, saved
python generate.py --insight unmatched-isrcs --brand verseiq --format all --save

# Full weekly bundle — every scheduled slot, every brand, as folders
python generate.py --weekly --save

# Force a specific insight for the weekly bundle
python generate.py --weekly --insight broken-splits --save
```

## Output layout (new)

Weekly bundle:

```
output/
└── 20260424_170000_weekly_neighboring-rights/
    ├── bundle.md                              ← text index + summary
    ├── preview.html                           ← open in browser: platform UI previews
    ├── heyroya/
    │   ├── friday_linkedin.txt
    │   └── threads.txt
    ├── trp-pro/
    │   ├── monday_linkedin.txt
    │   └── threads.txt
    ├── verseiq/
    │   ├── tuesday_tiktok.txt
    │   ├── thursday_carousel/
    │   │   ├── script.txt                     ← full 6-slide text breakdown
    │   │   ├── caption.txt                    ← short IG caption for the post body
    │   │   ├── slide-1.png                    ← rendered PNGs
    │   │   ├── slide-2.png
    │   │   ├── slide-3.png
    │   │   ├── slide-4.png
    │   │   ├── slide-5.png
    │   │   └── slide-6.png
    │   └── threads.txt
    └── traproyalties/
        ├── tuesday_tiktok.txt
        └── threads.txt
```

**The preview opens automatically** in your default browser right after `--save` finishes. You'll see every post rendered in the visual style of its target platform — LinkedIn card, Instagram carousel with swipe dots, TikTok vertical phone frame with the real beat PNGs inside, Threads card, X/Twitter thread. Character counters show if any post is over the platform limit (turns red).

Pass `--no-open` to suppress the auto-open (e.g. when running from a sandboxed shell or in scripts). The CLI will print the file path instead.

If auto-open doesn't work for any reason, you can always **double-click `preview.html`** in the bundle folder.

Single-brand single-insight bundle follows the same pattern: `output/<stamp>_<insight>_<brand>/<brand>/…`.

## Weekly schedule (hardcoded in generate.py)

| Slot | Format | Brand |
|-----|--------|-------|
| Monday | LinkedIn | TrapRoyaltiesPro |
| Tuesday | TikTok/Reel | TrapRoyalties + VerseIQ (2 posts) |
| Thursday | IG Carousel | VerseIQ (with 6 PNG slides) |
| Friday | LinkedIn | HeyRoya |
| Daily | Threads | All 4 brands (one file each) |

Edit `WEEKLY_SCHEDULE` in `generate.py` to change.

## PNG slide spec

| Property | Value |
|---|---|
| Dimensions | 1080 × 1350 px (IG portrait carousel) |
| Slide count | 6 per carousel |
| Safe margin | 80 px all sides |
| Slide types | hero · body · number · body · body · cta |
| Brand-driven | background, accent bar, pill color, text color all read from `brands.json.palette` |

Each brand in `brands.json` now has a `palette` block (bg, surface, ink, ink_muted, accent, accent2, alert) and a `mode` (`dark` or `light`). VerseIQ is the only light-mode brand — rendering adapts automatically.

## Adding a new insight

Edit `content_brain.json`:

```json
{
  "id": "kebab-case-unique-id",
  "problem": "One-line statement",
  "who": "artists, publishers",
  "impact": "Consequences",
  "example": "Real data point: 'X% missing, Y$ lost'",
  "fix": "What to do about it",
  "brandAffinity": ["heyroya", "trp-pro"],
  "emotionalHook": "5-7 word hook for TikTok / carousel cover",
  "forensicOpener": "Professional opener for LinkedIn",
  "threadsLine": "Conversational Threads-style line"
}
```

## Adding a new brand

Edit `brands.json`:

```json
"mybrand": {
  "name": "My Brand",
  "url": "mybrand.com",
  "audience": "artist",
  "voice": "emotional",
  "cta": "Full CTA line with → mybrand.com",
  "mode": "dark",
  "palette": {
    "bg": "#000000",
    "surface": "#1A1A1A",
    "ink": "#FFFFFF",
    "ink_muted": "#9CA3AF",
    "accent": "#FF00AA",
    "accent2": "#FFD700",
    "alert": "#F43F5E"
  }
}
```

## Workflow

1. **Monday**: `python generate.py --weekly --save`
2. Open `output/<latest>/`. Each brand folder holds that brand's posts for the week.
3. For the Thursday carousel: upload the 6 PNGs to Instagram, paste the caption from `caption.txt`.
4. For text formats: copy from the `.txt` file, paste into the target app.
5. Nothing auto-posts — you review every asset first.

## Preview-first philosophy

This generator **creates and previews**. It never posts, never emails, never sends. Every output is a file you review before copying to the destination platform.
