/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('chart', (table) => {
        table.date('date')
        table.integer('admin')
        table.integer('independent')
        table.integer('service')
        table.integer('deploiement')
        table.integer('design')
        table.integer('developpement')
        table.integer('coaching')
        table.integer('autre')
        table.integer('intraprenariat')
        table.integer('animation')
        table.integer('produit')
        table.integer('other')
        table.integer('male')
        table.integer('female')
        table.integer('nsp')
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  knex.schema.dropTable('chart')
};
