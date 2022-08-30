
export async function up(knex){
    return knex.schema
    .createTable('missions', (table) => {
        table.increments('id').defaultTo('primary')
        table.string('startup')
            .index()
            .references('id')
            .inTable('startups');
        table.string('status');
        table.text('role');
        table.string('employer');
        table.string('username')
        .index()
        .references('username')
        .inTable('users');
        table.date('start');
        table.date('end');
    });
}


export async function down(knex) {
    return knex.schema
    .dropTable('missions')
}

