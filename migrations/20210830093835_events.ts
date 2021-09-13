exports.up = function (knex) {
    return knex.schema
        .createTable('events', (table) => {
            table.uuid('id').primary().notNullable().defaultTo(knex.raw('uuid_generate_v4()'));
            table.text('created_by_username').notNullable();
            table.text('action_code').notNullable();
            table.text('action_description').notNullable();
            table.text('action_on_username').nullable();
            table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('events');
};
