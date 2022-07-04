/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
    .createTable('startups', (table) => {
        table.text('id').primary();
        table.text('name');
        table.text('pitch');
        table.text('stats_url');
        table.text('link');
        table.text('repository');
        table.text('contact');
        table.json('phases');
        table.text('current_phase');
        table.text('incubators');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    knex.schema.dropTable('startups')
};
