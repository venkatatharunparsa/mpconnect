import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { loadEnvConfig } from "@next/env";
import * as schema from "./schema";

loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set (see .env.example)");

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

