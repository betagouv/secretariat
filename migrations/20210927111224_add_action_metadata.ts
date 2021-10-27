exports.up = function(knex) {
    return knex.raw(`
        CREATE EXTENSION hstore;
        ALTER TABLE events
        ADD COLUMN action_metadata hstore;
    `).then(() => {
        return knex.schema
        .alterTable('events', (table) => {
            table.dropColumn('action_description');
        });
    })

}


exports.down = function(knex) {
    return knex.raw(`
        CREATE EXTENSION hstore;
        ALTER TABLE events
        DROP COLUMN action_metadata hstore;
    `).then(() => {
        return knex.schema
        .alterTable('events', async (table) => {
            table.text('action_description').notNullable();
        });
    })
    
}

