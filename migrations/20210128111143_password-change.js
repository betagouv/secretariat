exports.up = function (knex) {
  return knex.schema
    .createTable('password_reset_tokens', (table) => {
      table.text('token').primary();
      table.text('username').notNullable();
      table.text('email').notNullable();
      table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
      table.datetime('expires_at').notNullable();
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTable('password_reset_tokens');
};
