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

async function runMigrations() {
  logger.info('Starting database migration process...');

  let initialConnection;
  try {
    // 1. Initial connection without database to ensure target database exists
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
    logger.error(`Could not connect to MySQL server: ${err.message}`);
    process.exit(1);
  } finally {
    if (initialConnection) await initialConnection.end();
  }

  // 2. Connect to the target database with multipleStatements enabled
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

    // 3. Ensure migrations table exists
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Retrieve list of already executed migrations
    const [rows] = await dbConnection.query('SELECT migration_name FROM migrations');
    const executedMigrations = new Set(rows.map(r => r.migration_name));

    // 5. Read migration SQL files
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

      await dbConnection.beginTransaction();
      try {
        await dbConnection.query(sqlContent);
        await dbConnection.query('INSERT INTO migrations (migration_name) VALUES (?)', [file]);
        await dbConnection.commit();
        logger.info(`[SUCCESS] Migration applied: ${file}`);
        appliedCount++;
      } catch (migrationError) {
        await dbConnection.rollback();
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
