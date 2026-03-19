/**
 * Database Configuration (Neon PostgreSQL)
 */

const { Pool } = require('pg');
require('dotenv').config();

// Create connection using DATABASE_URL (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// When connected
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

// Error handling
pool.on('error', (err) => {
  console.error('❌ Database error:', err);
});

/**
 * Execute a query
 */
const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('❌ Query error:', error);
    throw error;
  }
};

/**
 * Transaction support
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Test connection
 */
const testConnection = async () => {
  try {
    await query('SELECT NOW()');
    console.log('✅ Database test successful');
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};