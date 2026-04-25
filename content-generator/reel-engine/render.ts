/**
 * CLI renderer — takes a tiktok .txt + .mp3 + brand id → outputs reel.mp4
 *
 * Usage:
 *   npx tsx render.ts <script.txt> <audio.mp3> <brandId> <output.mp4>
 */
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
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

  const raw = fs.readFileSync(scriptPath, 'utf-8');
  const script = parseScript(raw);

  if (!fs.existsSync(audioPath)) {
    console.error(`Audio not found: ${audioPath}`);
    process.exit(1);
  }
  const absAudio = path.resolve(audioPath);
  const audioSrc = `file://${absAudio.replace(/\\/g, '/')}`;

  console.log(`Bundling Remotion project...`);
  const bundleLocation = await bundle({
    entryPoint: path.join(__dirname, 'src', 'index.ts'),
  });

  console.log(`Resolving composition...`);
  const comps = await getCompositions(bundleLocation, {
    inputProps: { script, brand, audioSrc },
  });
  const comp = comps.find((c) => c.id === 'TrapReel');
  if (!comp) {
    console.error('Composition "TrapReel" not found.');
    process.exit(1);
  }

  console.log(`Rendering → ${outPath}`);
  await renderMedia({
    composition: comp,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outPath,
    inputProps: { script, brand, audioSrc },
  });

  console.log(`Done: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
