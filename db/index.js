module.exports = require('knex')({
  client: 'pg',
  connection: {
    host : process.env.PGHOST,
    user : process.env.PGUSER,
    password : process.env.PGPASSWORD,
    database : process.env.PGDATABASE
  }
});
