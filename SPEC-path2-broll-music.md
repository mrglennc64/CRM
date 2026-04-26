# Path 2 — Beef up Remotion: B-roll + music + animated captions

## Goal
Take the current Remotion text-and-voice reel and make it watchable by adding stock B-roll behind the words, a music bed under the voiceover, and TikTok-style word-level captions synced to the audio. Still 100% programmatic — no recording, no manual edit. Stays inside the existing CRM.

## Visual upgrade summary

| Layer | What it adds | Source |
|---|---|---|
| Background B-roll | Looping stock footage matching keywords from each section | Pexels Video API (free) |
| Music bed | 25-30 sec instrumental, ducked −18 dB under voice | YouTube Audio Library / FreePD (free) |
| Animated captions | Word-by-word reveal, color-emphasized keywords, synced to MP3 | OpenAI Whisper word-level timestamps |
| Brand intro/outro | 1.5 sec animated logo sting | Remotion (already in palette) |
| Lower-third CTA | Persistent brand handle in corner during last 4 seconds | Remotion |

## Architecture

```
content-generator/reel-engine/
├── src/
│   ├── Video.tsx                     # composition (existing) — extend
│   ├── screens/                      # existing 5 screens — restyle
│   ├── BRoll.tsx                     # NEW — fetches from Pexels, picks per section
│   ├── WordCaptions.tsx              # NEW — reads word_timings.json, animates
│   ├── MusicBed.tsx                  # NEW — picks track, ducks under voice
│   ├── Intro.tsx, Outro.tsx          # NEW — 1.5s brand stings
│   └── assets.ts                     # NEW — keyword → broll mapping registry
├── broll-cache/                      # downloaded MP4 stock clips, ~50 MB total
├── music/                            # 5-10 instrumental tracks, royalty-free
└── render.ts                         # extended — runs Whisper for word timings before render

trapcrm/
└── src/app/api/crm/render-video/     # extended — same flow but waits longer (~3-5 min)
```

## Step-by-step pipeline

```
1. User approves script in review panel
2. CRM POST /api/crm/render-video
3. tts-bridge → ElevenLabs MP3 (script.mp3)         [5 sec]
4. NEW: whisper-bridge → word_timings.json          [10-30 sec]
   • OpenAI Whisper API ($0.006/min) or local whisper.cpp
5. NEW: broll-fetch → 5 stock clips downloaded      [5-15 sec]
   • Per section, search Pexels with keywords:
     hook → "music studio dark"
     pain → "headphones empty room"
     example → "spreadsheet money laptop"
     fix → "studio mixing board hands"
     cta → "phone screen tap"
6. Remotion bundle + render                          [60-120 sec]
   • Composition layers (bottom → top):
     [music bed ducked] → [B-roll loop] → [text overlays] → [word captions] → [CTA]
7. Output: traproyalties_reel.mp4 ~30-50 MB
```

## Pexels integration

**API**: https://www.pexels.com/api/documentation/
**Free tier**: 200 requests/hr, 20k/month — way more than needed
**Auth**: paste API key into trapcrm/.env.local
```
PEXELS_API_KEY=your_key_here
```

**Search example** (we'd run server-side in render.ts):
```
GET https://api.pexels.com/videos/search?query=music+studio+dark&per_page=10&orientation=portrait
```

Returns array of clips. We download the smallest variant (≤1080×1920, ≤10 sec) into `broll-cache/<hash>.mp4`. Cache by keyword hash so we don't re-download.

## Keyword mapping registry

`assets.ts` ships with a hand-curated map of insight → search terms:

```ts
export const BROLL_KEYWORDS: Record<string, string[]> = {
  // insight_id → [hook keywords, pain keywords, example, fix, cta]
  'unmatched-isrcs':       ['streaming', 'audio waveform', 'spreadsheet money', 'mixing board', 'phone tap'],
  'missing-contributors':  ['recording session', 'rejected paperwork', 'contract signature', 'document upload', 'phone tap'],
  'broken-splits':         ['music collaboration', 'pie chart', 'dispute discussion', 'calculator math', 'phone tap'],
  // ... etc
};
```

User can override per-render later via review panel (out of scope for v1).

## Animated captions

**Whisper API call**:
```ts
const transcript = await openai.audio.transcriptions.create({
  file: fs.createReadStream('script.mp3'),
  model: 'whisper-1',
  response_format: 'verbose_json',
  timestamp_granularities: ['word'],
});
// → transcript.words = [{word: 'You\'re', start: 0.12, end: 0.34}, ...]
```

**Component**:
```tsx
<WordCaptions
  words={words}                       // from word_timings.json
  highlightColor={brand.palette.accent}
  fontWeight={900}
  position="lower-third"
/>
```

Behavior: word fades in at `start`, stays bold while spoken, dim after `end`. Keywords (royalty/$, %, missing, free) auto-highlighted in `accent2`.

## Music bed

5-10 royalty-free tracks in `music/` matching different vibes:
- `dark-trap-loop.mp3` — for HeyRoya/TRP Pro forensic tone
- `chill-lofi-loop.mp3` — for VerseIQ/TR artist tone
- `urgent-tense.mp3` — for "you're losing money" style hooks

Pick by `brand.voice` (forensic/emotional). Loop, fade in 0.5s, **duck −18 dB during voice** (Remotion `<Audio volume={fn}/>` callback).

## Brand intro/outro stings

1.5 sec each, all-Remotion (no external assets):
- Intro: brand wordmark fades in + accent bar wipe
- Outro: large brand URL pill on accent background

## Sizes & costs

| Item | Size / Cost |
|---|---|
| Render output MP4 | ~30-50 MB per reel |
| B-roll cache total | ~50-200 MB after warming |
| Whisper API per reel | $0.006 (1-min audio) |
| Pexels | free |
| Music | free |
| ElevenLabs (existing) | already paying $5/mo |
| Render time per reel | 90-180 sec (vs 30-60 today) |
| **Marginal cost per reel** | **<$0.01** |

## Build estimate

| Phase | Effort |
|---|---|
| Pexels integration + cache | 4-6 hr |
| Whisper integration + word captions component | 4-6 hr |
| Music bed + ducking | 2-3 hr |
| Intro/outro stings | 1-2 hr |
| Keyword registry + UI override (optional) | 2-3 hr |
| **Total** | **13-20 hr** |

## What it WON'T fix

- Still no real human face on screen → less authentic than Path 3
- Stock B-roll is generic, may feel templated after a few reels
- Captions help but voiceover is still TTS — clocks as AI for some viewers
- Best for **B2B/forensic content** (publishers) where polish > authenticity. Less effective for artist-targeted TikToks where personality matters.

## When to pick Path 2

- You want consistent polished output without recording yourself
- You're targeting publishers/B2B (LinkedIn-flavored)
- Volume > authenticity (10+ reels/week)
- You don't want to be on camera

## When to NOT pick Path 2

- You're targeting artists who scroll TikTok (they spot AI quickly)
- You want personal brand recognition tied to your face
- You'd rather record once and let CRM handle the polish (→ Path 3)
