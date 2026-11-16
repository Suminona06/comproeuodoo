import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool } from '../../config/database.js';
import logger from '../../utils/logger.js';
import { syncSeedAssets } from '../../utils/seedAssetsSync.js';
import { SNAPSHOT_TABLES, normalizeColumnValue, buildUpsertSql } from './snapshotSchema.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_PATH = path.join(__dirname, 'snapshot.json');

async function seedDefaultUsers(connection) {
  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'AdminEuodoo2026!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);
  const defaultUsers = [
    {
      email: process.env.ADMIN_DEFAULT_EMAIL || 'admin@euodoo.com',
      full_name: process.env.ADMIN_DEFAULT_NAME || 'Super Administrator',
      role: 'superadmin'
    },
    {
      email: 'staff.admin@euodoo.com',
      full_name: 'Operations Admin',
      role: 'admin'
    },
    {
      email: 'editor@euodoo.com',
      full_name: 'Content Editor',
      role: 'editor'
    }
  ];

  for (const user of defaultUsers) {
    await connection.query(
      `INSERT INTO users (email, password_hash, full_name, role, failed_attempts, locked_until)
       VALUES (?, ?, ?, ?, 0, NULL)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         role = VALUES(role),
         failed_attempts = 0,
         locked_until = NULL`,
      [user.email, passwordHash, user.full_name, user.role]
    );
  }
  return defaultUsers.length;
}

async function upsertTableRows(connection, spec, rows) {
  if (rows.length === 0) return;
  const sql = buildUpsertSql(spec);
  for (const row of rows) {
    const params = spec.columns.map((col) => normalizeColumnValue(spec, col, row[col]));
    await connection.query(sql, params);
  }
}

async function seedSnapshotTables(connection, tables) {
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    for (const spec of SNAPSHOT_TABLES) {
      await upsertTableRows(connection, spec, tables[spec.name] || []);
    }
  } finally {
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  }
}

async function runV2Seed() {
  const overwriteAssets = process.argv.includes('--force');
  logger.info('Starting database seeding v2.0 from snapshot...');

  if (!fs.existsSync(SNAPSHOT_PATH)) {
    throw new Error(`Snapshot seed file not found: ${SNAPSHOT_PATH}`);
  }

  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  const assetResult = syncSeedAssets({ overwrite: overwriteAssets });
  logger.info(`[SEED v2] Upload assets synced (copied: ${assetResult.copied}, skipped: ${assetResult.skipped}).`);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const userCount = await seedDefaultUsers(connection);
    await seedSnapshotTables(connection, snapshot.tables || {});
    await connection.commit();
    logger.info(`[SEED v2] Seeded ${userCount} users and ${Object.keys(snapshot.tables || {}).length} content tables.`);
  } catch (err) {
    await connection.rollback();
    logger.error('Error during database seeding v2.0:', { message: err.message });
    throw err;
  } finally {
    connection.release();
    await pool.end();
  }
}

runV2Seed().catch((err) => {
  logger.error('Seed v2 process terminated with error:', { message: err.message });
  process.exit(1);
});
