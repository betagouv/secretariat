require('dotenv').config();

module.exports = {
    client: 'postgresql',
    connection: {
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      host: process.env.PGHOST,
      port: process.env.PGPORT,
    },
    migrations: {
      tableName: 'knex_migrations'
    }
};
