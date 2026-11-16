import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import logger from '../../utils/logger.js';
import { extractReferencedUploadRelPaths, syncActiveUploadsToSeedAssets } from '../../utils/seedAssetsSync.js';
import { SNAPSHOT_TABLES, normalizeColumnValue, buildUpsertSql } from './snapshotSchema.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_SNAPSHOT_PATH = path.join(__dirname, 'snapshot.json');
const DEFAULT_MIGRATION_PATH = path.resolve(__dirname, '../migrations/020_seed_current_content_v1.sql');

function getDbConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'euodoo_db',
    dateStrings: true
  };
}

function parseMigrationFlag(argv) {
  const idx = argv.indexOf('--write-migration');
  if (idx === -1) return null;
  const next = argv[idx + 1];
  if (next && !next.startsWith('--')) return path.resolve(process.cwd(), next);
  return DEFAULT_MIGRATION_PATH;
}

async function fetchSnapshotTables(connection) {
  const tables = {};
  for (const spec of SNAPSHOT_TABLES) {
    const colSql = spec.columns.map((c) => `\`${c}\``).join(', ');
    const [rows] = await connection.query(`SELECT ${colSql} FROM \`${spec.name}\` ORDER BY ${spec.orderBy}`);
    tables[spec.name] = rows;
  }
  return tables;
}

function buildSqlMigrationContent(tables) {
  const lines = [
    '-- Migration 020: Snapshot konten, copywriting, dan referensi media terkini',
    '-- Dibangkitkan oleh database/seeds/exportSnapshot.js',
    '',
    'SET FOREIGN_KEY_CHECKS = 0;',
    ''
  ];

  for (const spec of SNAPSHOT_TABLES) {
    const rows = tables[spec.name] || [];
    if (rows.length === 0) continue;
    const sqlTemplate = buildUpsertSql(spec);
    lines.push(`-- Table: ${spec.name} (${rows.length} rows)`);
    for (const row of rows) {
      const params = spec.columns.map((col) => normalizeColumnValue(spec, col, row[col]));
      lines.push(`${mysql.format(sqlTemplate, params)};`);
    }
    lines.push('');
  }

  lines.push('SET FOREIGN_KEY_CHECKS = 1;');
  lines.push('');
  return lines.join('\n');
}

/**
 * Export current live database content and referenced upload assets to snapshot.json,
 * database/seed-assets/uploads/, and optionally a SQL migration file.
 * @returns {Promise<void>}
 */
export async function exportSnapshot() {
  const migrationOutPath = parseMigrationFlag(process.argv.slice(2));
  const connection = await mysql.createConnection(getDbConfig());

  try {
    const tables = await fetchSnapshotTables(connection);
    const snapshot = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      tables
    };

    fs.writeFileSync(DEFAULT_SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
    const relPaths = extractReferencedUploadRelPaths(tables);
    const assetResult = syncActiveUploadsToSeedAssets(relPaths);

    if (assetResult.missing.length > 0) {
      throw new Error(`Missing referenced uploads on disk: ${assetResult.missing.join(', ')}`);
    }

    if (migrationOutPath) {
      const sqlContent = buildSqlMigrationContent(tables);
      fs.writeFileSync(migrationOutPath, sqlContent, 'utf8');
      logger.info(`[EXPORT] Wrote SQL migration: ${migrationOutPath}`);
    }

    logger.info(`[EXPORT] Saved snapshot.json (${Object.keys(tables).length} tables) & synced ${assetResult.copied} active assets (pruned ${assetResult.pruned}).`);
  } finally {
    await connection.end();
  }
}

exportSnapshot().catch((err) => {
  logger.error('Snapshot export failed:', { message: err.message });
  process.exit(1);
});
