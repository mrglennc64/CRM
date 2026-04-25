/**
 * Voiceover via ElevenLabs JS SDK (native — no Python shell-out).
 *
 * Voice: tXoAX6rzg9vkoUfJKy0k (your cloned voice)
 * Model: eleven_multilingual_v2
 * Format: mp3_44100_128
 *
 * Generates an MP3 from the spoken portions of a TikTok/Reel script .txt.
 */
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

// Your cloned voice — never overridden
export const VOICE_ID = 'tXoAX6rzg9vkoUfJKy0k';
export const MODEL_ID = 'eleven_multilingual_v2';
export const OUTPUT_FORMAT = 'mp3_44100_128';

let _client: ElevenLabsClient | null = null;
function client(): ElevenLabsClient {
  if (_client) return _client;
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    throw new Error(
      'ELEVENLABS_API_KEY missing. Add it to trapcrm/.env.local — get one at https://elevenlabs.io/app/settings/api-keys',
    );
  }
  _client = new ElevenLabsClient({ apiKey: key });
  return _client;
}

/**
 * Pull the spoken lines (PAIN + REAL EXAMPLE + FIX + CTA) out of a labeled
 * TikTok script. The HOOK is on-screen-only, not voiced.
 */
export function extractVoiceover(scriptText: string): string {
  const lines = scriptText.split(/\r?\n/);
  const sections: Record<string, string[]> = {};
  let current: string | null = null;

  for (const ln of lines) {
    const s = ln.trim();
    if (!s) continue;
    if (s.startsWith('=') || s.startsWith('-')) continue;
    if (s.endsWith(':') && /^[A-Z]/.test(s)) {
      current = s.slice(0, -1).split('(')[0].trim().toLowerCase();
      sections[current] = [];
      continue;
    }
    if (current) sections[current].push(s);
  }

  const order = ['pain', 'real example', 'fix', 'cta'];
  return order
    .map((k) => (sections[k] ?? []).join(' ').trim())
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Synthesize text → MP3 bytes.
 */
export async function synthesize(text: string): Promise<Buffer> {
  const audio = await client().textToSpeech.convert(VOICE_ID, {
    text,
    modelId: MODEL_ID,
    outputFormat: OUTPUT_FORMAT,
  });

  // SDK returns either a ReadableStream or a Blob-like with arrayBuffer().
  // Handle both shapes.
  if (audio && typeof (audio as any).arrayBuffer === 'function') {
    return Buffer.from(await (audio as any).arrayBuffer());
  }
  // Stream → collect chunks
  const chunks: Buffer[] = [];
  for await (const chunk of audio as any) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Generate the MP3 next to a tiktok script .txt. Returns the MP3 path.
 * Skips work if the MP3 already exists (unless `force` is true).
 */
export async function generateVoiceover(
  scriptTxtPath: string,
  opts: { force?: boolean } = {},
): Promise<string> {
  if (!existsSync(scriptTxtPath)) {
    throw new Error(`Script not found: ${scriptTxtPath}`);
  }
  const mp3Path = scriptTxtPath.replace(/\.txt$/, '.mp3');
  if (existsSync(mp3Path) && !opts.force) return mp3Path;

  const script = readFileSync(scriptTxtPath, 'utf-8');
  const voiceText = extractVoiceover(script);
  if (!voiceText) {
    throw new Error(`No voiceover content in ${scriptTxtPath} (HOOK + voiceover sections required)`);
  }

  const audio = await synthesize(voiceText);
  writeFileSync(mp3Path, audio);
  return mp3Path;
}
