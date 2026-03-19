/**
 * Database Configuration
 * PostgreSQL connection pool configuration using pg-pool
 */
const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'taskflow_pro',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // Pool configuration
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  min: parseInt(process.env.DB_POOL_MIN || '5'),
  acquire: parseInt(process.env.DB_POOL_ACQUIRE || '60000'),
  idle: parseInt(process.env.DB_POOL_IDLE || '10000'),
  // Connection timeout
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
  // SSL configuration for production
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
};

// Create connection pool
const pool = new Pool(dbConfig);

// Pool event handlers
pool.on('connect', () => {
  console.log('New client connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
  process.exit(-1);
});

/**
 * Execute a SQL query with parameters
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise} - Query result
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 50), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise} - Database client
 */
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  // Monkey patch the query method to log queries
  client.query = async (text, params) => {
    const start = Date.now();
    try {
      const result = await query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query with client', { text: text.substring(0, 50), duration });
      return result;
    } catch (error) {
      console.error('Client query error:', error);
      throw error;
    }
  };
  
  return { client, release };
};

/**
 * Execute queries within a transaction
 * @param {Function} callback - Async function that receives client and executes queries
 * @returns {Promise} - Transaction result
 */
const transaction = async (callback) => {
  const { client, release } = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    release();
  }
};

/**
 * Test database connection
 * @returns {Promise<boolean>} - Connection status
 */
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('Database connected successfully at:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

/**
 * Close all pool connections
 */
const closePool = async () => {
  await pool.end();
  console.log('Database pool closed');
};

module.exports = {
  pool,
  query,
  getClient,
  transaction,
  testConnection,
  closePool
};
