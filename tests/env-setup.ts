// Use this file to override environment variables for test.

import dotenv from 'dotenv';
import { parse } from 'pg-connection-string';

dotenv.config();

if (process.env.DATABASE_URL) {
  const config = parse(process.env.DATABASE_URL);
  const testDbName = `${config.database}__test`;
  console.log(`Overriding DATABASE_URL for test with database : ${testDbName}`);
  process.env.DATABASE_URL = `postgres://${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}@${encodeURIComponent(config.host)}:${encodeURIComponent(config.port)}/${encodeURIComponent(testDbName)}`;
} else {
  console.log('Environment variable DATABASE_URL not found');
}
