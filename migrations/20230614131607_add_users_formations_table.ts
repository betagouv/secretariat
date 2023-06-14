exports.up = function(knex) {
    return knex.schema.createTable('users_formations', (table) => {
        table.uuid('formation_id')
            .unsigned()
            .index()
            .references('id')
            .inTable('formations');
        table.text('username')
            .unsigned()
            .index()
            .references('username')
            .inTable('users');
    })
}


exports.down = function(knex) {
    return knex.schema
    .drop('users_formations') 
}

