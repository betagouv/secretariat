exports.up = function(knex) {
    return knex.schema.alterTable('users', (table) => {
      table.string('legal_status').alter();
    });
};
  
exports.down = function(knex) {
    return knex.schema.alterTable('users', (table) => {
        table.integer('legal_status').alter();
    });
};