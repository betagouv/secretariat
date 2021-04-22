exports.up = function (knex) {
  return knex.schema
    .alterTable('newsletters', (table) => {
      table.dropPrimary();
    });
};

exports.down = async function (knex) {
  await knex.schema
  .alterTable('newsletters', (table) => {
    table.primary('year_week');
  });
};
