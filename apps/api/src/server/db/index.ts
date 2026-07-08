import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Load local env file if present
const envLocalPath = join(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  const envContent = readFileSync(envLocalPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const matched = line.match(/^([^#=]+)=(.*)$/);
    if (matched && !process.env[matched[1].trim()]) {
      process.env[matched[1].trim()] = matched[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set (see .env.example)");

const client = postgres(connectionString, { 
  prepare: false,
  ssl: "require"
});
export const db = drizzle(client, { schema });

