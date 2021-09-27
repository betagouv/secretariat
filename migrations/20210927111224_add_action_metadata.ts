import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        CREATE EXTENSION hstore;
        ALTER TABLE events
        ADD COLUMN action_metadata hstore;
    `);
    return knex.schema
    .alterTable('events', (table) => {
        table.dropColumn('action_description');
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        CREATE EXTENSION hstore;
        ALTER TABLE events
        DROP COLUMN action_metadata hstore;
    `);
    return knex.schema
    .alterTable('events', async (table) => {
        table.text('action_description').notNullable();
    });
}

