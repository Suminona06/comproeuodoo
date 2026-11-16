import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { SNAPSHOT_TABLES } from '../database/seeds/snapshotSchema.js';
import { validateMigrationSequence } from '../utils/migrationSequence.js';
import {
  DEFAULT_SEED_ASSETS_DIR,
  extractReferencedUploadRelPaths,
  syncSeedAssets
} from '../utils/seedAssetsSync.js';

describe('Seed Snapshot & Media Asset Sync', () => {
  it('1. snapshot.json exists, includes all 15 tables, and excludes users/inquiries', () => {
    const snapshotPath = path.resolve('database/seeds/snapshot.json');
    assert.equal(fs.existsSync(snapshotPath), true, 'snapshot.json must exist');

    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
    assert.ok(snapshot.tables && typeof snapshot.tables === 'object');
    assert.equal(snapshot.tables.users, undefined, 'users must not be exported to snapshot.json');
    assert.equal(snapshot.tables.inquiries, undefined, 'inquiries must not be exported to snapshot.json');

    for (const spec of SNAPSHOT_TABLES) {
      assert.ok(Array.isArray(snapshot.tables[spec.name]), `Missing table ${spec.name} in snapshot`);
    }
  });

  it('2. every referenced /uploads/ asset in snapshot.json exists in database/seed-assets/uploads/', () => {
    const snapshot = JSON.parse(fs.readFileSync(path.resolve('database/seeds/snapshot.json'), 'utf8'));
    const relPaths = extractReferencedUploadRelPaths(snapshot.tables);
    assert.ok(relPaths.length > 0, 'Expected referenced upload assets in snapshot');

    for (const relPath of relPaths) {
      const fullPath = path.join(DEFAULT_SEED_ASSETS_DIR, relPath);
      assert.equal(fs.existsSync(fullPath), true, `Missing baseline asset: ${relPath}`);
    }
  });

  it('3. syncSeedAssets copies missing files and preserves existing files unless overwrite=true', () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'euodoo-seed-sync-'));
    try {
      const srcDir = path.join(tmpRoot, 'src');
      const destDir = path.join(tmpRoot, 'dest');
      fs.mkdirSync(path.join(srcDir, 'media'), { recursive: true });
      fs.writeFileSync(path.join(srcDir, 'media', 'sample.webp'), 'new-content', 'utf8');

      const firstRun = syncSeedAssets({ sourceDir: srcDir, targetDir: destDir, overwrite: false });
      assert.deepEqual(firstRun, { total: 1, copied: 1, skipped: 0 });
      assert.equal(fs.readFileSync(path.join(destDir, 'media', 'sample.webp'), 'utf8'), 'new-content');

      fs.writeFileSync(path.join(destDir, 'media', 'sample.webp'), 'prod-edited', 'utf8');
      const secondRun = syncSeedAssets({ sourceDir: srcDir, targetDir: destDir, overwrite: false });
      assert.deepEqual(secondRun, { total: 1, copied: 0, skipped: 1 });
      assert.equal(fs.readFileSync(path.join(destDir, 'media', 'sample.webp'), 'utf8'), 'prod-edited');

      const forceRun = syncSeedAssets({ sourceDir: srcDir, targetDir: destDir, overwrite: true });
      assert.deepEqual(forceRun, { total: 1, copied: 1, skipped: 0 });
      assert.equal(fs.readFileSync(path.join(destDir, 'media', 'sample.webp'), 'utf8'), 'new-content');
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  it('4. migration 020_seed_current_content_v1.sql exists and keeps migration sequence valid', () => {
    const migrationPath = path.resolve('database/migrations/020_seed_current_content_v1.sql');
    assert.equal(fs.existsSync(migrationPath), true, '020_seed_current_content_v1.sql must exist');

    const files = fs.readdirSync(path.resolve('database/migrations')).filter((f) => f.endsWith('.sql')).sort();
    assert.equal(validateMigrationSequence(files), true);
  });
});
