import { config } from "dotenv";
config();

module.exports = {
  client: 'postgresql',
  connection: process.env.DATABASE_URL,
  migrations: {
    tableName: 'knex_migrations',
  },
  seeds: {
    extension: 'ts',
    directory: './tests/seed',
  },
};
