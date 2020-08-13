require('dotenv').config();

module.exports = {
    client: 'postgresql',
    connection: {
      connection: process.env.DATABASE_URL
    },
    migrations: {
      tableName: 'knex_migrations'
    }
};
