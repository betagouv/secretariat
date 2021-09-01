import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.table('users', (table) => {
    table.boolean('departure_validated');
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('users', (table) => {
    table.dropColumn('assignedUniversityId');
  });
}

