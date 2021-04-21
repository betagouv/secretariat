const getWeekNumber = (d) => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  let weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  weekNo = weekNo.toString();
  return weekNo.length === 1 ? `0${weekNo}` : weekNo;
};

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
      table.text('year_week');
    });
  const newsletters = await knex('newsletters').select('*');
  await Promise.all(newsletters.map((newsletter) => knex('newsletters').where({
    created_at: newsletter.created_at,
  }).update({
    year_week: `${(newsletter.sent_at || newsletter.created_at).getFullYear()}-${getWeekNumber(newsletter.sent_at || newsletter.created_at)}`,
  })));
  await knex.schema
  .alterTable('newsletters', (table) => {
    table.primary('year_week');
  });
};
