
exports.up = function(knex) {
    return knex.schema
      .createTable('marrainage', (table) => {
        table.text('username').primary();
        table.text('last_onboarder').notNullable();
        table.integer('count').notNullable().defaultTo(1);
        table.boolean('completed').notNullable().defaultTo(false);
        table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
        table.datetime('last_updated').notNullable().defaultTo(knex.fn.now());
      })
  };
  
  exports.down = function(knex) {
    return knex.schema
      .dropTable('marrainage')
  };
  
