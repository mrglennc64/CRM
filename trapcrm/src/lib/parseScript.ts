/**
 * Parse + build TikTok/Reel script .txt files.
 * Same labeled format produced by content-generator/generate.py.
 */

export interface ParsedScript {
  hook: string;
  pain: string;
  example: string;
  fix: string;
  cta: string;
}

const ORDER: (keyof ParsedScript)[] = ['hook', 'pain', 'example', 'fix', 'cta'];

const LABELS: Record<keyof ParsedScript, string> = {
  hook:    'HOOK (on-screen text, 5-7 words):',
  pain:    'PAIN (voiceover, 1-2 sentences):',
  example: 'REAL EXAMPLE (voiceover):',
  fix:     'FIX (quick, non-technical):',
  cta:     'CTA:',
};

/** Section header → key. "REAL EXAMPLE (voiceover):" → "example" */
function headerToKey(header: string): keyof ParsedScript | null {
  const head = header.split('(')[0].trim().toLowerCase();
  if (head === 'hook') return 'hook';
  if (head === 'pain') return 'pain';
  if (head === 'real example') return 'example';
  if (head === 'fix') return 'fix';
  if (head === 'cta') return 'cta';
  return null;
}

export function parseScript(raw: string): ParsedScript {
  const lines = raw.split(/\r?\n/);
  const sections: Partial<Record<keyof ParsedScript, string[]>> = {};
  let current: keyof ParsedScript | null = null;

  for (const ln of lines) {
    const s = ln.trim();
    if (!s) continue;
    if (s.startsWith('=') || s.startsWith('-')) continue;
    if (s.endsWith(':') && /^[A-Z]/.test(s)) {
      const key = headerToKey(s.slice(0, -1));
      if (key) {
        current = key;
        sections[key] = [];
      } else {
        current = null;
      }
      continue;
    }
    if (current) sections[current]!.push(s);
  }

  return {
    hook:    (sections.hook    ?? []).join(' ').trim(),
    pain:    (sections.pain    ?? []).join(' ').trim(),
    example: (sections.example ?? []).join(' ').trim(),
    fix:     (sections.fix     ?? []).join(' ').trim(),
    cta:     (sections.cta     ?? []).join(' ').trim(),
  };
}

/** Reassemble a parsed script back into the labeled .txt format. */
export function buildScript(parsed: ParsedScript, brandName: string): string {
  const bar = '======================================';
  const out: string[] = [
    bar,
    `TIKTOK / IG REEL SCRIPT — ${brandName}`,
    bar,
    '',
  ];
  for (const key of ORDER) {
    out.push(LABELS[key]);
    out.push(parsed[key] || '');
    out.push('');
  }
  out.push(bar);
  out.push('Tone: fast, emotional, creator-friendly.');
  out.push('Length: 15-25 seconds.');
  out.push('Caption: Same hook + CTA.');
  return out.join('\n');
}
