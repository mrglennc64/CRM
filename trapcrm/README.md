# TrapCRM

Internal CRM for the marketing pipeline. Click a contact → generate content → generate video → done.

Brands: HeyRoya, TrapRoyaltiesPro, VerseIQ, TrapRoyalties.
Style: dark slate (`#0D0F12`) + indigo (`#4F46E5`) + cyan (`#22D3EE`).

## What it does

1. Loads contacts (artists + publishers) seeded from `../outreach/*.csv`.
2. On each contact page, two buttons:
   - **Generate Content** → calls `../content-generator/generate.py` → writes a folder of text + carousel PNGs.
   - **Generate Video** → also runs ElevenLabs (your cloned voice) + Remotion → outputs an MP4 reel.
3. All assets are recorded in the `generated_assets` table and rendered inline on the contact page.

## Stack

| Piece | Tech |
|---|---|
| App | Next.js 14 (App Router) + React 18 + TypeScript |
| DB | SQLite via `better-sqlite3` |
| Styling | Tailwind |
| Content engine | Shells out to `../content-generator/generate.py` (Python, unchanged) |
| Voiceover | Shells out to `../content-generator/tts.py` (ElevenLabs) |
| Video | Shells out to `../content-generator/reel-engine/render.ts` (Remotion) |

Nothing is duplicated — the CRM is a thin wrapper over your existing engine.

## First run

```bash
cd trapcrm
npm install                 # ~150 packages, 1-2 min
cp .env.example .env.local
# edit .env.local — paste ELEVENLABS_API_KEY
npm run db:init             # imports publishers.csv + artists.csv (~470 contacts)
npm run dev                 # opens http://localhost:3000
```

## Folder structure

```
trapcrm/
├── src/
│   ├── app/
│   │   ├── layout.tsx, page.tsx              ← root, redirects to /crm
│   │   ├── globals.css                        ← Tailwind + style C base
│   │   ├── crm/
│   │   │   ├── layout.tsx                     ← sidebar wrapper
│   │   │   ├── page.tsx                       ← dashboard
│   │   │   ├── components/Sidebar.tsx
│   │   │   ├── components/GenerateButtons.tsx ← client component, the magic buttons
│   │   │   ├── contacts/page.tsx              ← list + filters
│   │   │   ├── contacts/[id]/page.tsx         ← contact detail + asset grid
│   │   │   ├── companies/page.tsx             ← placeholder
│   │   │   ├── deals/page.tsx                 ← placeholder
│   │   │   └── assets/page.tsx                ← all assets gallery
│   │   └── api/crm/
│   │       ├── contacts/route.ts              GET, POST
│   │       ├── contacts/[id]/route.ts         GET, PATCH, DELETE
│   │       ├── assets/route.ts                GET (?contact=N optional)
│   │       ├── generate-content/route.ts      POST
│   │       ├── generate-video/route.ts        POST
│   │       └── file/route.ts                  GET ?p=<absolute_path>  (sandboxed)
│   ├── db/
│   │   ├── schema.sql                         ← contacts, companies, deals, generated_assets
│   │   ├── client.ts                          ← `db()` singleton
│   │   └── seed.ts                            ← imports CSVs
│   └── lib/
│       ├── content-engine.ts                  ← shell to Python generate.py
│       ├── tts-bridge.ts                      ← shell to Python tts.py
│       └── render-video.ts                    ← shell to Remotion render.ts
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── .env.example
├── .gitignore
└── trapcrm.db                                 ← SQLite (gitignored)
```

## DB schema

Four tables:

- `contacts` — name, email, role (artist/publisher), brand_affinity, IG, TikTok, Spotify, country, notes, last_generated_at
- `companies` — labels/publishers/distributors with metadata maturity score (placeholder UI)
- `deals` — pipeline (lead → qualified → audit → proposal → closed) (placeholder UI)
- `generated_assets` — every script/audio/video/thumbnail with paths

Run `npm run db:init` any time to re-seed from CSVs (idempotent — matches by name).

## Generate flow

```
[Contact page] → click "Generate Content"
   ↓
POST /api/crm/generate-content { contact_id, insight_id? }
   ↓
generate-content/route.ts
   ↓
exec: python generate.py --insight <id> --brand <contact.brand_affinity> --format all --save
   ↓
content-generator/output/<timestamp>_<id>_<brand>/<brand>/  (folder with .txt + carousel PNGs)
   ↓
INSERT INTO generated_assets ... → returns asset_id
   ↓
[Contact page refreshes, shows new asset card]
```

```
[Contact page] → click "Generate Video"
   ↓
POST /api/crm/generate-video { contact_id, insight_id? }
   ↓
generate-video/route.ts
   ↓
1. exec generate.py (creates tiktok.txt)
2. exec tts.py     (creates tiktok.mp3 from tiktok.txt using cloned voice)
3. exec npx tsx reel-engine/render.ts (creates reel.mp4 from tiktok.txt + tiktok.mp3)
   ↓
UPDATE generated_assets SET status='ready', video_path, audio_path
   ↓
[Contact page refreshes, shows <video> player]
```

## Environment variables

In `.env.local`:

| Var | Purpose | Default |
|---|---|---|
| `ELEVENLABS_API_KEY` | Voice synthesis | (required for video) |
| `CONTENT_GENERATOR_PATH` | Path to ../content-generator | `../content-generator` |
| `PYTHON_BIN` | Python interpreter | `python` (use `py` if needed on Windows) |
| `ALLOWED_VPS` | Reserved for future ops | `187.77.111.16` |

## Routes

```
GET  /crm                           → dashboard
GET  /crm/contacts                  → contacts list (?role, ?brand, ?q)
GET  /crm/contacts/:id              → contact detail
GET  /crm/companies                 → placeholder
GET  /crm/deals                     → placeholder
GET  /crm/assets                    → all generated assets

GET  /api/crm/contacts              → list (?role, ?brand, ?q)
POST /api/crm/contacts              → create
GET  /api/crm/contacts/:id          → read
PATCH /api/crm/contacts/:id         → update
DELETE /api/crm/contacts/:id        → delete

GET  /api/crm/assets                → list (?contact=N optional)
POST /api/crm/generate-content      → triggers Python generate.py
POST /api/crm/generate-video        → triggers full ElevenLabs + Remotion pipeline
GET  /api/crm/file?p=<absolute>     → streams files from output/ (sandboxed to that dir)
```

## What's deliberately not built yet

- Companies UI (schema exists, page is placeholder)
- Deals pipeline UI (schema exists, page is placeholder)
- Auth — local-only single-user tool
- Server-side ops at 187.77.111.16 — separate work, requires explicit per-action go-ahead
- Auto-posting bots (Threads/LinkedIn/IG) — separate work, requires explicit per-action go-ahead

## Local-only by design

This CRM never talks to production websites or to the VPS unless you explicitly add that later. All generated files live under `../content-generator/output/` and the SQLite DB is one file (`trapcrm.db`) in this folder.
