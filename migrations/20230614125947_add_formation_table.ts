exports.up = function(knex) {
    return knex.schema.createTable('formations', (table) => {
        table.uuid('id').primary().notNullable().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('airtable_id').unique();
        table.text('name').notNullable();
        table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
        table.datetime('formation_date').notNullable().defaultTo(knex.fn.now());
    })
}


exports.down = function(knex) {
    return knex.schema
    .drop('formations') 
}

