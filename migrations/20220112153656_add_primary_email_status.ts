exports.up = function(knex) {
  return knex.schema.table('users', (table) => {
    table.text('primary_email_status');
    table.datetime('primary_email_status_updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', (table) => {
    table.dropColumn('primary_email_status');
    table.datetime('primary_email_status_updated_at');
  });
};
