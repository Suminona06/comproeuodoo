import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_SEED_ASSETS_DIR = path.resolve(__dirname, '../database/seed-assets/uploads');
export const DEFAULT_PUBLIC_UPLOADS_DIR = path.resolve(__dirname, '../public/uploads');

const UPLOAD_URL_REGEX = /\/uploads\/([a-zA-Z0-9_./-]+)/g;

function walkRelativeFiles(dir, baseDir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkRelativeFiles(fullPath, baseDir));
      continue;
    }
    if (entry.name !== '.gitkeep') results.push(path.relative(baseDir, fullPath));
  }
  return results.sort();
}

function isSafeInside(baseDir, targetPath) {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetPath);
  return resolvedTarget.startsWith(`${resolvedBase}${path.sep}`);
}

/**
 * Extract unique relative upload paths (e.g. "media/foo.webp") from serialized snapshot data.
 * @param {unknown} data
 * @returns {string[]}
 */
export function extractReferencedUploadRelPaths(data) {
  const serialized = typeof data === 'string' ? data : JSON.stringify(data);
  const found = new Set();
  for (const match of serialized.matchAll(UPLOAD_URL_REGEX)) {
    const rel = match[1].replace(/^\/+/, '');
    if (rel && !rel.includes('..')) found.add(rel);
  }
  return [...found].sort();
}

function copyIfEligible(src, dest, overwrite) {
  if (!overwrite && fs.existsSync(dest)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return true;
}

/**
 * Copy baseline upload assets into public/uploads without overwriting existing CMS uploads unless overwrite=true.
 * @param {{ sourceDir?: string, targetDir?: string, overwrite?: boolean }} [options]
 * @returns {{ total: number, copied: number, skipped: number }}
 */
export function syncSeedAssets(options = {}) {
  const sourceDir = options.sourceDir || DEFAULT_SEED_ASSETS_DIR;
  const targetDir = options.targetDir || DEFAULT_PUBLIC_UPLOADS_DIR;
  const overwrite = Boolean(options.overwrite);
  const files = walkRelativeFiles(sourceDir, sourceDir);

  let copied = 0;
  let skipped = 0;

  for (const relPath of files) {
    const src = path.join(sourceDir, relPath);
    const dest = path.join(targetDir, relPath);
    if (!isSafeInside(sourceDir, src) || !isSafeInside(targetDir, dest)) continue;
    if (copyIfEligible(src, dest, overwrite)) copied += 1;
    else skipped += 1;
  }

  return { total: files.length, copied, skipped };
}

/**
 * Copy only active referenced upload files into database/seed-assets/uploads and prune stale files.
 * @param {string[]} relPaths
 * @param {{ uploadsDir?: string, seedAssetsDir?: string }} [options]
 * @returns {{ copied: number, pruned: number, missing: string[] }}
 */
export function syncActiveUploadsToSeedAssets(relPaths, options = {}) {
  const uploadsDir = options.uploadsDir || DEFAULT_PUBLIC_UPLOADS_DIR;
  const seedAssetsDir = options.seedAssetsDir || DEFAULT_SEED_ASSETS_DIR;
  const activeSet = new Set(relPaths.map((p) => p.split(path.sep).join('/')));

  let copied = 0;
  const missing = [];
  for (const relPath of activeSet) {
    const src = path.join(uploadsDir, relPath);
    const dest = path.join(seedAssetsDir, relPath);
    if (!isSafeInside(uploadsDir, src) || !isSafeInside(seedAssetsDir, dest)) continue;
    if (!fs.existsSync(src)) {
      missing.push(relPath);
      continue;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    copied += 1;
  }

  const pruned = pruneStaleSeedAssets(seedAssetsDir, activeSet);
  return { copied, pruned, missing };
}

function pruneStaleSeedAssets(seedAssetsDir, activeSet) {
  let pruned = 0;
  for (const existing of walkRelativeFiles(seedAssetsDir, seedAssetsDir)) {
    const normalized = existing.split(path.sep).join('/');
    if (activeSet.has(normalized)) continue;
    fs.unlinkSync(path.join(seedAssetsDir, existing));
    pruned += 1;
  }
  return pruned;
}

export default {
  extractReferencedUploadRelPaths,
  syncSeedAssets,
  syncActiveUploadsToSeedAssets
};
