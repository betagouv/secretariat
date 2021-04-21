const { getWeekNumber } = require('../controllers/utils');

exports.up = function (knex) {
  return knex.schema
    .alterTable('newsletters', (table) => {
      table.dropPrimary();
      table.primary('created_at');
      table.dropColumn('year_week');
    });
};

exports.down = async function (knex) {
  await knex.schema
    .alterTable('newsletters', (table) => {
      table.dropPrimary();
    });
  const newsletters = await knex('newsletters').select('*');
  await Promise.all(newsletters.map((newsletter) => knex('newsletters').where({
    created_at: newsletter.created_at,
  }).update({
    created_at: `${(newsletter.sent_at || newsletter.created_at).getFullYear()}-${getWeekNumber(newsletter.sent_at || newsletter.created_at)}`,
  })));
  await knex.schema
  .alterTable('newsletters', (table) => {
    table.primary('created_at');
  });
};
