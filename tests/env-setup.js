// Use this file to override environment variables for test.

require('dotenv').config();

if (process.env.PGDATABASE) {
  const testDbName = `${process.env.PGDATABASE}__test`;
  console.log(`Overriding env name PGDATABASE for test : ${testDbName}`);
  process.env['PGDATABASE'] = testDbName;
} else {
  console.log('Environment variable PGDATABASE not found');
}
