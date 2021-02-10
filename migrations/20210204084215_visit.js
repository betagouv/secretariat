exports.up = function (knex) {
  return knex.schema
      .createTable('visits', (table) => {
        table.increments('id').primary().unsigned();
        table.text('fullname').notNullable();
        table.text('referent').notNullable();
        table.text('number').notNullable();
        table.text('requester').notNullable();
        table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
        table.datetime('date').notNullable();
      });
};

exports.down = function (knex) {
  return knex.schema
      .dropTable('visits');
};
