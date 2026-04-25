/**
 * CLI renderer — takes a tiktok .txt + .mp3 + brand id → outputs reel.mp4
 *
 * Note: copies the MP3 into reel-engine/public/ before render, because
 * Remotion's renderer can only serve assets from its public folder
 * (no file:// URIs allowed).
 */
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseScript } from './src/parseScript';
import { BRANDS } from './src/brands';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const [scriptPath, audioPath, brandId, outPath] = process.argv.slice(2);

  if (!scriptPath || !audioPath || !brandId || !outPath) {
    console.error('Usage: tsx render.ts <script.txt> <audio.mp3> <brandId> <output.mp4>');
    process.exit(1);
  }

  const brand = BRANDS[brandId];
  if (!brand) {
    console.error(`Unknown brand: ${brandId}. Options: ${Object.keys(BRANDS).join(', ')}`);
    process.exit(1);
  }

  if (!existsSync(scriptPath)) { console.error(`Script not found: ${scriptPath}`); process.exit(1); }
  if (!existsSync(audioPath))  { console.error(`Audio not found: ${audioPath}`);   process.exit(1); }

  const script = parseScript(readFileSync(scriptPath, 'utf-8'));

  // Copy audio into reel-engine/public/ — Remotion only serves from there
  const publicDir = path.join(__dirname, 'public');
  if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });
  const audioFilename = 'audio.mp3';
  copyFileSync(audioPath, path.join(publicDir, audioFilename));
  console.log(`Audio copied → public/${audioFilename}`);

  console.log('Bundling Remotion project...');
  const bundleLocation = await bundle({
    entryPoint: path.join(__dirname, 'src', 'index.ts'),
    publicDir,
  });

  console.log('Resolving composition...');
  const inputProps = { script, brand, audioSrc: audioFilename };
  const comps = await getCompositions(bundleLocation, { inputProps });
  const comp = comps.find((c) => c.id === 'TrapReel');
  if (!comp) { console.error('Composition "TrapReel" not found.'); process.exit(1); }

  console.log(`Rendering → ${outPath}`);
  await renderMedia({
    composition: comp,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outPath,
    inputProps,
  });

  console.log(`Done: ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
