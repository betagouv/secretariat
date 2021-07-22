import knex from "knex";
import { config } from "dotenv";

config();

export default knex({
  client: "pg",
  connection: process.env.DATABASE_URL
});
