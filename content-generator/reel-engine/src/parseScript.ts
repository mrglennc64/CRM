/** Parse labeled TikTok script (.txt) into structured hook/pain/example/fix/cta. */
export interface ParsedScript {
  hook: string;
  pain: string;
  example: string;
  fix: string;
  cta: string;
}

export function parseScript(raw: string): ParsedScript {
  const lines = raw.split(/\r?\n/);
  const sections: Record<string, string[]> = {};
  let current: string | null = null;

  for (const ln of lines) {
    const s = ln.trim();
    if (!s) continue;
    if (s.startsWith('=') || s.startsWith('-')) continue;

    if (s.endsWith(':') && /^[A-Z]/.test(s)) {
      const head = s.slice(0, -1).split('(')[0].trim().toLowerCase();
      current = head;
      sections[current] = [];
      continue;
    }

    if (current) sections[current].push(s);
  }

  const take = (key: string) => (sections[key] ?? []).join(' ').trim();

  return {
    hook: take('hook'),
    pain: take('pain'),
    example: take('real example'),
    fix: take('fix'),
    cta: take('cta'),
  };
}
