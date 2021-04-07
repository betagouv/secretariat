exports.up = function (knex) {
  return knex.schema
    .createTable('newsletters', (table) => {
      table.text('year_week').primary();
      table.text('validator');
      table.text('url').notNullable();
      table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
      table.datetime('sent_at');
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTable('newsletters');
};
