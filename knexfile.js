require('dotenv').config();

module.exports = {
    client: 'postgresql',
    connection: {
      connection: process.env.PG_CONNECTION_STRING
    },
    migrations: {
      tableName: 'knex_migrations'
    }
};
