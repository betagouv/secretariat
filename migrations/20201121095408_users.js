exports.up = function (knex) {
  return knex.schema
    .createTable('users', (table) => {
      table.text('username').primary();
      table.text('secondary_email');
      table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTable('users');
};
