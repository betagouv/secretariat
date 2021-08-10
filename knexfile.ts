export default {
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
