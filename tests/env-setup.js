// Use this file to override environment variables for test.

require('dotenv').config();
const parse = require('pg-connection-string').parse;

if (process.env.PG_CONNECTION_STRING) {
  const config = parse(process.env.PG_CONNECTION_STRING)
  const testDbName = `${config.database}__test`
  console.log(`Overriding PG_CONNECTION_STRING for test with database : ${testDbName}`);
  process.env.PG_CONNECTION_STRING = `postgres://${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}@${encodeURIComponent(config.host)}:${encodeURIComponent(config.port)}/${encodeURIComponent(testDbName)}`
} else {
  console.log('Environment variable PG_CONNECTION_STRING not found');
}
