exports.up = function (knex) {
  return knex.schema
        .alterTable('newsletters', (table) => {
          table.string('year_week').nullable().alter();
          table.uuid('id').primary().notNullable().defaultTo(knex.raw('uuid_generate_v4()'));
        });
};

exports.down = function (knex) {
  return knex.schema
  .alterTable('newsletters', (table) => {
    table.string('year_week').notNullable().alter();
    table.dropColumn('id');
  });
};
