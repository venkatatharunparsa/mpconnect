import "./load-env";

import postgres from "postgres";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const sql = postgres(connectionString, { prepare: false, ssl: "require" });
  try {
    await sql`ALTER TABLE demands ADD COLUMN IF NOT EXISTS photo_url text`;
    console.log("Ensured demands.photo_url column exists.");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("Failed to add photo_url column:", err);
  process.exit(1);
});
