require('dotenv').config();

module.exports = {
  client: 'postgresql',
  connection: process.env.DATABASE_URL,
  migrations: {
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './tests/seed',
  },
};
