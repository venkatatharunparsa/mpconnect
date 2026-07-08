import { defineConfig } from "drizzle-kit";
import { loadEnvLocal } from "./src/server/load-env-local";

loadEnvLocal();

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
