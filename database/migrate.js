import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'euodoo_db'
};

const IDEMPOTENT_ERROR_CODES = new Set([
  1050, // ER_TABLE_EXISTS_ERROR
  1060, // ER_DUP_FIELDNAME
  1061, // ER_DUP_KEYNAME
  1091, // ER_CANT_DROP_FIELD_OR_KEY
  1826  // ER_FK_DUP_NAME
]);

function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inString = false;
  let quoteChar = '';
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (inString) {
      current += char;
      if (char === '\\') {
        i++;
        if (i < sql.length) current += sql[i];
      } else if (char === quoteChar) {
        inString = false;
      }
      continue;
    }

    if (char === '-' && nextChar === '-') {
      inLineComment = true;
      i++;
      continue;
    }

    if (char === '/' && nextChar === '*') {
      inBlockComment = true;
      i++;
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      inString = true;
      quoteChar = char;
      current += char;
      continue;
    }

    if (char === ';') {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) {
    statements.push(trimmed);
  }

  return statements;
}

async function runMigrations() {
  logger.info('Starting database migration process...');

  let initialConnection;
  try {
    initialConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });

    await initialConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    logger.info(`Verified database '${dbConfig.database}' exists.`);
  } catch (err) {
    logger.warn(`Initial database verification skipped (${err.message}). Connecting directly to target database.`);
  } finally {
    if (initialConnection) await initialConnection.end();
  }

  let dbConnection;
  try {
    dbConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      multipleStatements: true
    });

    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [rows] = await dbConnection.query('SELECT migration_name FROM migrations');
    const executedMigrations = new Set(rows.map(r => r.migration_name));

    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      logger.info('No migration files found in database/migrations.');
      await dbConnection.end();
      return;
    }

    let appliedCount = 0;

    for (const file of files) {
      if (executedMigrations.has(file)) {
        logger.debug(`Skipping already applied migration: ${file}`);
        continue;
      }

      logger.info(`Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      if (!sqlContent.trim()) {
        logger.warn(`Migration file ${file} is empty, skipping.`);
        continue;
      }

      const statements = splitSqlStatements(sqlContent);
      try {
        for (const stmt of statements) {
          try {
            await dbConnection.query(stmt);
          } catch (stmtError) {
            if (IDEMPOTENT_ERROR_CODES.has(stmtError.errno)) {
              logger.debug(`[IDEMPOTENT NOTICE] Skipped (${stmtError.errno}): ${stmtError.message}`);
            } else {
              throw stmtError;
            }
          }
        }
        await dbConnection.query('INSERT INTO migrations (migration_name) VALUES (?)', [file]);
        logger.info(`[SUCCESS] Migration applied: ${file} (${statements.length} statements)`);
        appliedCount++;
      } catch (migrationError) {
        logger.error(`Migration ${file} failed: ${migrationError.message}`);
        throw migrationError;
      }
    }

    if (appliedCount === 0) {
      logger.info('Database is already up to date. No new migrations applied.');
    } else {
      logger.info(`Successfully applied ${appliedCount} migration(s).`);
    }
  } catch (err) {
    logger.error(`Migration execution stopped with error: ${err.message}`);
    process.exit(1);
  } finally {
    if (dbConnection) await dbConnection.end();
  }
}

runMigrations().catch(err => {
  logger.error('Unhandled migration error:', { message: err.message });
  process.exit(1);
});
