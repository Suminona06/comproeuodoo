import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'euodoo_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
  charset: 'utf8mb4',
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

export const pool = mysql.createPool(dbConfig);

/**
 * Helper to run query with parameters
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Array>}
 */
export const query = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

/**
 * Helper to run prepared statement execution
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<any>}
 */
export const execute = async (sql, params = []) => {
  const [result] = await pool.execute(sql, params);
  return result;
};

/**
 * Test database connectivity
 * @returns {Promise<boolean>}
 */
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    logger.info(`Connected to MySQL database [${dbConfig.database}] on ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    return true;
  } catch (err) {
    logger.warn(`Database connection check failed: ${err.message}. Ensure MySQL is running and .env is configured.`);
    return false;
  }
};

export default pool;
