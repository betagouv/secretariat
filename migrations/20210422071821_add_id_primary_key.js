exports.up = function (knex) {
  return knex.schema
        .alterTable('newsletters', (table) => {
          table.increments('id').primary().unsigned();
        });
};

exports.down = function (knex) {
  return knex.schema
  .alterTable('newsletters', (table) => {
    table.dropColumn('id');
  });
};
