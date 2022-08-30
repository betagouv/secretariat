/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = function(knex) {
    return knex.schema.dropTable('missions')
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.createTable('missions', (table) => {
        table.date('start')
        table.date('end')
        table.string('domaine')
        table.text('gender').defaultTo('NSP');
    });
};
