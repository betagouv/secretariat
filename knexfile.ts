import { Knex } from 'knex';

const config: Knex.Config = {
  client: 'postgresql',
  connection: process.env.DATABASE_URL,
  migrations: {
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './tests/seed',
  },
};

export default config;
