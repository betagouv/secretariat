exports.up = function (knex) {
  return knex.schema
        .alterTable('newsletters', (table) => {
          table.string('year_week').nullable().alter();
          table.increments('id').primary().unsigned();
        });
};

exports.down = function (knex) {
  return knex.schema
  .alterTable('newsletters', (table) => {
    table.string('year_week').notNullable().alter();
    table.dropColumn('id');
  });
};
