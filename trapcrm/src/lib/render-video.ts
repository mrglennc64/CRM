/**
 * Bridge to the Remotion render pipeline at marketing/content-generator/reel-engine/.
 * Calls `npx tsx render.ts <script> <audio> <brand> <out>` for each TikTok script.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, statSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { generateVoiceover } from './tts-bridge';

const exec = promisify(execFile);

const REEL_ENGINE = resolve(
  process.cwd(),
  (process.env.CONTENT_GENERATOR_PATH || '../content-generator') + '/reel-engine',
);

export interface RenderOptions {
  scriptTxtPath: string;
  brandId: string;
  outMp4Path: string;
}

export async function renderReel(opts: RenderOptions): Promise<string> {
  if (!existsSync(REEL_ENGINE)) {
    throw new Error(`Remotion project not found at ${REEL_ENGINE}`);
  }
  if (!existsSync(opts.scriptTxtPath)) {
    throw new Error(`Script not found: ${opts.scriptTxtPath}`);
  }

  // Voiceover MP3 sits next to the script
  const expectedMp3 = opts.scriptTxtPath.replace(/\.txt$/, '.mp3');
  let audioPath = expectedMp3;
  if (!existsSync(audioPath)) {
    audioPath = await generateVoiceover(opts.scriptTxtPath);
  }

  await exec(
    'npx',
    ['tsx', 'render.ts', opts.scriptTxtPath, audioPath, opts.brandId, opts.outMp4Path],
    { cwd: REEL_ENGINE, maxBuffer: 32 * 1024 * 1024 },
  );

  return opts.outMp4Path;
}

/**
 * Find tiktok scripts in a bundle. Handles two layouts produced by generate.py:
 *   1. Folder layout (current): <brand>/<day>_tiktok/script.txt
 *   2. Flat layout (legacy):    <brand>/<day>_tiktok.txt
 */
export function findTikTokScripts(bundleDir: string): { path: string; brandId: string }[] {
  const hits: { path: string; brandId: string }[] = [];
  if (!existsSync(bundleDir)) return hits;

  for (const brandDir of readdirSync(bundleDir)) {
    const fullBrand = join(bundleDir, brandDir);
    if (!statSync(fullBrand).isDirectory()) continue;

    for (const f of readdirSync(fullBrand)) {
      const fullF = join(fullBrand, f);
      const isDir = statSync(fullF).isDirectory();
      const lname = f.toLowerCase();

      // Layout 1: <brand>/<day>_tiktok/script.txt
      if (isDir && lname.includes('tiktok')) {
        const scriptPath = join(fullF, 'script.txt');
        if (existsSync(scriptPath)) {
          hits.push({ path: scriptPath, brandId: brandDir });
        }
        continue;
      }

      // Layout 2: <brand>/<day>_tiktok.txt
      if (!isDir && lname.includes('tiktok') && f.endsWith('.txt')) {
        hits.push({ path: fullF, brandId: brandDir });
      }
    }
  }
  return hits;
}
