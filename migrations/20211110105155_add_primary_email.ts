exports.up = function(knex) {
  return knex.schema.table('users', (table) => {
    table.text('primary_email');
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', (table) => {
    table.dropColumn('primary_email');
  });
};
