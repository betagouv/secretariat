const { Pool, Client } = require('pg')
const pool = new Pool()
require('dotenv').config();

/**
 * Create the login tokens table
 */
const loginTokensRequestsTable = () => {
  const loginTokenCreateQuery = `CREATE TABLE IF NOT EXISTS login_tokens
  (token TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL)`;

  return pool.query(loginTokenCreateQuery)
    .then((res) => {
      console.log(res);
      pool.end();
    })
    .catch((err) => {
      console.log(err);
      pool.end();
    });
};

/**
 * Create All Tables
 */

console.log('Creating DB tables')
loginTokensRequestsTable();
