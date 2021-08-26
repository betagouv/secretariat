import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema
  .createTable('user_departure_state', (table) => {
    table.text('username').primary();
    table.boolean('has_validated');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema
  .dropTable('user_departure_state');
}

