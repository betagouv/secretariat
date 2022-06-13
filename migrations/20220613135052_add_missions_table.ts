/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('missions', (table) => {
        table.date('start')
        table.date('end')
        table.string('domaine')
        table.text('gender').defaultTo('NSP');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.table('missions', (table) => {
        table.dropColumn('start')
        table.dropColumn('end')
        table.dropColumn('domaine')
        table.dropColumn('gender').defaultTo('NSP');
    })
};
