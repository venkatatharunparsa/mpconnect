import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { loadEnvLocal } from "../load-env-local";

loadEnvLocal();

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set (see .env.example)");

const client = postgres(connectionString, { 
  prepare: false,
  ssl: "require"
});
export const db = drizzle(client, { schema });

