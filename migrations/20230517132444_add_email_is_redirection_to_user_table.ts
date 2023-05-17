exports.up = function(knex) {
    return knex.schema
    .alterTable('users', (table) => {
        table.boolean('email_is_redirection').defaultTo(false)
        table.string('member_type')
    })
}


exports.down = function(knex) {
    return knex.schema
    .alterTable('users', async (table) => {
        table.delete('email_is_redirection');
        table.delete('member_type')
    });   
}
