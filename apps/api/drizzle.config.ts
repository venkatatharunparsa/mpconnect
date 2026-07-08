import { defineConfig } from "drizzle-kit";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Dependency-free env loader for local migrations
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

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
