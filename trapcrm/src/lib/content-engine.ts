/**
 * Bridge to the Python content engine at marketing/content-generator/generate.py.
 * Shell-out approach — no logic duplicated in TS, no rewrite needed.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const exec = promisify(execFile);

const CG_PATH = resolve(
  process.cwd(),
  process.env.CONTENT_GENERATOR_PATH || '../content-generator',
);
const PYTHON = process.env.PYTHON_BIN || 'python';

export interface GenerateOptions {
  insightId?: string;       // pick a specific insight (else weekly auto-rotates)
  brandId: string;          // heyroya | trp-pro | verseiq | traproyalties
  format?: string;          // tiktok | linkedin | threads | carousel | twitter | all
  weekly?: boolean;         // generate full weekly bundle for this brand's slots
}

export interface GenerateResult {
  bundleDir: string;        // absolute path
  files: string[];          // relative paths within bundleDir
}

export async function generateContent(opts: GenerateOptions): Promise<GenerateResult> {
  if (!existsSync(CG_PATH)) {
    throw new Error(`Content generator not found at ${CG_PATH}. Set CONTENT_GENERATOR_PATH in .env.local`);
  }

  const args = ['generate.py', '--save'];
  if (opts.weekly) {
    args.push('--weekly');
    if (opts.insightId) args.push('--insight', opts.insightId);
  } else {
    if (!opts.insightId) throw new Error('insightId required when not weekly');
    args.push('--insight', opts.insightId, '--brand', opts.brandId);
    if (opts.format) args.push('--format', opts.format);
  }

  const before = listBundles();
  await exec(PYTHON, args, { cwd: CG_PATH, maxBuffer: 8 * 1024 * 1024 });
  const after = listBundles();

  // Newest bundle = last one created
  const newBundles = after.filter((b) => !before.includes(b));
  const latest = newBundles.length > 0 ? newBundles[newBundles.length - 1] : after[after.length - 1];
  if (!latest) throw new Error('No bundle was created. Check content-generator/output/.');

  const bundleDir = join(CG_PATH, 'output', latest);
  const files = walkRel(bundleDir);
  return { bundleDir, files };
}

export function listInsights(): { id: string; problem: string; who: string }[] {
  const brainPath = join(CG_PATH, 'content_brain.json');
  if (!existsSync(brainPath)) return [];
  const brain = JSON.parse(readFileSync(brainPath, 'utf-8'));
  return (brain.insights || []).map((i: any) => ({ id: i.id, problem: i.problem, who: i.who }));
}

export function getBrands(): Record<string, any> {
  const brandsPath = join(CG_PATH, 'brands.json');
  if (!existsSync(brandsPath)) return {};
  return JSON.parse(readFileSync(brandsPath, 'utf-8'));
}

function listBundles(): string[] {
  const out = join(CG_PATH, 'output');
  if (!existsSync(out)) return [];
  return readdirSync(out).filter((d) => statSync(join(out, d)).isDirectory()).sort();
}

function walkRel(root: string, prefix = ''): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    const rel = prefix ? `${prefix}/${entry}` : entry;
    if (statSync(full).isDirectory()) results.push(...walkRel(full, rel));
    else results.push(rel);
  }
  return results;
}

export const PATHS = { CG_PATH, OUTPUT_DIR: join(CG_PATH, 'output') };
