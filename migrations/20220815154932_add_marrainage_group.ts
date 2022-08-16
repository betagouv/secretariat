/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    const createMarrainageGroup = await knex.schema.createTable('marrainage_groups', (table) => {
        table.increments('id').defaultTo('primary')
        table.string('onboarder')
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.string('status').defaultTo('PENDING');
        table.integer('count').notNullable().defaultTo(0);
    });
    
    const createMarrainageGroupMember = await knex.schema.createTable('marrainage_groups_members', (table) => {
        table.bigInteger('marrainage_group_id')
            .unsigned()
            .index()
            .references('id')
            .inTable('marrainage_groups');
        table.string('username')
            .index()
            .references('username')
            .inTable('users');
        table.primary(['marrainage_group_id', 'username']);
    });

    return
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    await knex.schema.dropTable('marrainage_groups_members')

    await knex.schema.dropTable('marrainage_groups')
};
