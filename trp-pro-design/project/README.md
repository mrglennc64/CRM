# TrapRoyaltiesPro — Design System

> **Real catalog cleaning, real data, real financial impact.**

This design system powers all visual + written output for **TrapRoyaltiesPro**, a royalty‑intelligence and metadata‑health platform. It contains the brand's color, type, spacing, iconography, voice, components, and ready-to-use carousel templates for social.

---

## What is TrapRoyaltiesPro?

TrapRoyaltiesPro is a **hybrid platform + professional cleaning service** for music catalogs. We help artists, publishers, attorneys, and catalog owners:

1. **Identify** missing royalties through a free catalog scan
2. **Fix** metadata gaps via a done‑for‑you cleaning service
3. **Deliver** submission‑ready CWR exports + forensic rights audits

We are positioned as the **"metadata dry‑cleaning service"** — you don't fix it, we fix it for you.

### Two audience segments

| Segment | Who | Pain | Channels |
|---|---|---|---|
| **Artists & Independent Creators** | Producers, indie artists, managers | Losing royalties to metadata gaps | TikTok, Instagram |
| **Publishers & Rights Teams** | Admins, publishers, attorneys, catalog owners | Operational chaos, compliance | LinkedIn, email, events |

### Offer

- **Free Catalog Scan** (lead magnet) — Spotify link or artist name → instant Submission Readiness Score, issue breakdown, leakage indicators
- **Full‑Service Metadata Cleaning** (core offer) — $149 single work → $1,499 large catalog → custom enterprise

### Proof points (use freely)

- Identified **€47,000** in missing royalties for a Nordic catalog
- Found **CA$2,000** in unpaid royalties for a 12‑track artist
- Detected **10–30%** royalty leakage in most catalogs

### Guarantee

> If we don't deliver a clean, submission‑ready catalog, **you don't pay.** No fine print. No risk. No subscriptions. No tools to learn.

---

## Sources

This system was built **from a written brief only** — no codebase, Figma, or existing visual assets were provided. All visual decisions (logo, type pairing, components) are original interpretations of the brief's positioning ("warm, premium, professional, not technical, gets-you-paid").

If you have an existing logo, brand book, or screenshots from the live product, **drop them in `assets/` and re-run the agent** — it will adapt.

---

## Content fundamentals (voice & tone)

The brand voice is **direct, money‑forward, confident, and unpretentious.** Copy reads like a knowledgeable friend who happens to run a forensic accounting firm.

### Rules

- **Lead with money.** "$2,000 missing" before "metadata gaps." Numbers first, mechanics second.
- **You, not we.** Write to a single artist or rights manager. "You're losing royalties" beats "Artists lose royalties."
- **Plain English over jargon.** Say "missing contributors" before "ISWC/IPI alignment." When jargon is unavoidable, define it inline.
- **Short, declarative sentences.** Two clauses max. Periods do work that commas can't.
- **Contrast, not hype.** "You don't fix metadata. We fix it for you." Set up an expectation, then break it.
- **No emoji in product UI.** A single ⭐ is acceptable in marketing decks for emphasis; otherwise none. Iconography is line-art SVGs.
- **Casing.** Sentence case for headlines and buttons. Title Case only for proper nouns ("Submission Readiness Score", "Free Catalog Scan").
- **Punctuation.** Em dashes (—) for asides. Periods after every line in social carousels, even one-liners. No exclamation points.
- **CTAs are imperatives.** "Get your free scan now." "Fix my catalog." "See what's broken."

### Examples (canonical)

✅ **You're getting streams… but not getting paid.**
✅ **12 tracks. $2,000 missing.**
✅ **You don't fix metadata. We fix it for you.**
✅ **If we don't deliver, you don't pay.**

❌ ~~Streamline your music metadata workflow with our innovative platform!~~
❌ ~~We help artists like you maximize their royalty potential 🚀~~
❌ ~~Discover the power of clean catalog data~~

---

## Visual foundations

### Color

A **warm, earth-toned palette** — amber and gold against deep brown and charcoal. No blues, no purples, no cool grays. The palette is built for high contrast on dark backgrounds (charcoal/brown) with amber/gold acting as the brand's "money" highlight color.

| Role | Hex | Notes |
|---|---|---|
| `--amber` | `#D97706` | Primary brand. CTAs, links, key numbers. |
| `--gold` | `#F59E0B` | Secondary highlight. Hovers, accents, gradients. |
| `--soft-yellow` | `#FDE68A` | Surfaces, badges, callouts on dark. |
| `--deep-brown` | `#78350F` | Dark surface, depth, premium feel. |
| `--charcoal` | `#1F2937` | Body text on light, base background on dark. |
| `--cream` | `#FFFBEB` | Light surface — never pure white. |
| `--paper` | `#FEF3C7` | Secondary light surface. |

We **never use pure white (#FFFFFF) or pure black (#000000).** Use `--cream` and `--charcoal` instead — they preserve warmth.

### Typography

- **Display / headlines:** **Fraunces** (variable serif, 700–900) — high contrast, slightly editorial, feels expensive. Use for hero numbers, slide headlines, dollar figures.
- **Body / UI:** **Inter** (400–600) — neutral, legible at small sizes. Used for everything else.
- **Mono / data:** **JetBrains Mono** (400–600) — for ISRCs, ISWCs, hash codes, "forensic" data presentation.

> ⚠️ **Substitution flag.** No font files were provided. We're using Google Fonts equivalents. If the brand has commissioned faces, drop the `.ttf`/`.woff2` into `fonts/` and update `colors_and_type.css`.

Type tracks tighter on display (-0.02em) and looser on small caps labels (0.08em).

### Spacing & layout

8px base grid. Spacing scale: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128`. Carousels and decks use **generous outer padding** (96px on a 1080×1080 frame) so text never crowds the edge.

### Backgrounds

Three styles, used in this order of frequency:

1. **Solid charcoal or deep-brown surfaces** with amber/gold text — the dominant look.
2. **Warm radial gradients** (amber → deep-brown) for hero panels and slide backgrounds.
3. **Subtle film grain** (~3–5% opacity noise) layered on top of solids and gradients to add tactility — never on white surfaces.

No stock photography, no AI photo art, no people. Imagery is **typographic and iconographic.**

### Borders, radii, shadow

- **Corner radius:** 4px (inputs, small chips), 12px (cards, buttons), 24px (large surfaces, modals). Pills (`9999px`) only for badges.
- **Borders:** 1px hairlines in `oklch(from var(--amber) l c h / 0.2)` — never pure black/gray borders. On dark surfaces, borders use soft-yellow at 15% opacity.
- **Shadow:** Two-layer warm shadows. Outer: `0 8px 32px -8px rgba(120, 53, 15, 0.25)`. Inner glow: `inset 0 1px 0 rgba(253, 230, 138, 0.1)` on dark cards. **No cool blue/black shadows.**

### Animation

- **Easing:** `cubic-bezier(0.32, 0.72, 0, 1)` (slight overshoot, settles confidently).
- **Duration:** 200ms for hover/press, 320ms for entries, 480ms for slide transitions.
- **Style:** subtle fades + 4–8px translates. No bounces, no springs, no parallax. The brand is professional, not playful.

### Hover & press

- **Hover (buttons):** lighten amber → gold, +1px lift via translateY(-1px), shadow intensifies.
- **Press:** scale(0.98), shadow flattens, no color change.
- **Hover (links/text):** underline appears, color shifts from charcoal → amber.

### Cards

- **Cream background** on light surfaces; **deep-brown or charcoal** on dark.
- 12px radius, 1px hairline border, soft warm shadow.
- 32px internal padding minimum.
- A subtle 1px top border in `--gold` is the canonical "premium" card treatment.

### Transparency & blur

Used sparingly. The two valid uses:

1. **Glass overlays** on hero gradients — `backdrop-filter: blur(12px)` over a `rgba(31, 41, 55, 0.4)` charcoal layer for nav bars on imagery.
2. **Protection scrims** — vertical gradient from transparent to charcoal, behind text overlaid on busy backgrounds.

### Layout rules

- **Fixed header** on marketing site, 72px tall, charcoal-on-cream or cream-on-charcoal.
- **Max content width:** 1200px for marketing, 720px for prose.
- **Asymmetric grids** preferred over centered columns — feels less templated.

---

## Iconography

See `assets/icons/` and the **ICONOGRAPHY** card on the Design System tab.

- **Style:** Lucide line icons, 1.75px stroke, rounded joins. Loaded from CDN (`unpkg.com/lucide-static`).
- **Color:** Always inherits `currentColor`. Amber for primary, charcoal/cream at 60% opacity for secondary.
- **Sizing:** 16 / 20 / 24 / 32 / 48px steps.
- **Custom marks:** the **TrapRoyaltiesPro logomark** (a crown over a soundwave) and the **"clean catalog" checkmark seal** are originals — see `assets/logo/`.
- **Emoji:** ❌ Not used in product UI. ⭐ tolerated as a single bullet glyph in marketing decks (the brief uses it).
- **Unicode:** `→` and `—` are fine. No `✓` checkmarks (use the SVG); no `★` stars.

> ⚠️ **Substitution flag.** Lucide is used in place of any commissioned icon set. Swap easily by dropping SVGs into `assets/icons/`.

---

## File index

```
README.md                         ← you are here
SKILL.md                          ← agent skill manifest
colors_and_type.css               ← all design tokens (CSS vars)
fonts/                            ← (empty — using Google Fonts CDN)
assets/
  logo/                           ← logomark + wordmark variations
  icons/                          ← brand-specific custom icons
preview/                          ← Design System tab cards
ui_kits/
  marketing/                      ← website kit (hero, pricing, FAQ, CTA)
slides/                           ← carousel templates (1080×1080)
carousels/                        ← all 12 finished carousels (60 slides)
content/
  captions.md                     ← captions + hashtags + 12-week schedule
```

## Index

- [colors_and_type.css](colors_and_type.css) — design tokens
- [SKILL.md](SKILL.md) — for use as an agent skill
- [ui_kits/marketing/index.html](ui_kits/marketing/index.html) — marketing site UI kit
- [carousels/index.html](carousels/index.html) — all 12 carousels viewer
- [content/captions.md](content/captions.md) — captions, hashtags, schedule
