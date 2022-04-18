exports.up = function(knex) {
    return knex.schema.table('users', (table) => {
      table.text('gender').defaultTo('NSP');
      table.text('workplace_insee_code');
      table.integer('tjm');
      table.integer('legal_status');
    });
};
  
exports.down = function(knex) {
    return knex.schema.table('users', (table) => {
        table.dropColumn('gender');
        table.dropColumn('workplace_insee_code');
        table.dropColumn('tjm');
        table.dropColumn('legal_status');
    });
};