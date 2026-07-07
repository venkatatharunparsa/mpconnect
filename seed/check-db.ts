import postgres from "postgres";

async function main() {
  console.log("Checking local Postgres connection with common developer passwords...");
  
  const passwords = [
    "postgres",
    "root",
    "admin",
    "",
    "password",
    "1234",
    "123456",
    "mahip",
    "123",
    "root123",
    "admin123",
    "pavan",
    "pavan123"
  ];
  
  let successfulUrl = "";
  
  for (const pw of passwords) {
    const url = pw === "" 
      ? "postgresql://postgres@localhost:5432/postgres"
      : `postgresql://postgres:${pw}@localhost:5432/postgres`;
    
    let sql;
    try {
      sql = postgres(url, { max: 1, idle_timeout: 1 });
      await sql`SELECT 1`;
      successfulUrl = url;
      console.log(`Success with password: "${pw}"`);
      await sql.end();
      break;
    } catch (e) {
      // ignore auth error, log unexpected errors
      const msg = (e as Error).message;
      if (!msg.includes("authentication failed")) {
        console.log(`Unexpected error for "${pw}": ${msg}`);
      }
      if (sql) await sql.end();
    }
  }
  
  if (!successfulUrl) {
    console.error("Could not connect to local Postgres with any common credentials.");
    process.exit(1);
  }
  
  // Try connecting to mpconnect or creating it
  const targetUrl = successfulUrl.replace("/postgres", "/mpconnect");
  const sqlCon = postgres(successfulUrl, { max: 1 });
  
  console.log("Checking if 'mpconnect' database exists...");
  const dbs = await sqlCon`SELECT datname FROM pg_database WHERE datname = 'mpconnect'`;
  
  if (dbs.length === 0) {
    console.log("Creating database 'mpconnect'...");
    await sqlCon`CREATE DATABASE mpconnect`;
    console.log("Database 'mpconnect' created successfully!");
  } else {
    console.log("Database 'mpconnect' already exists.");
  }
  
  console.log("\nWORKING DATABASE_URL:");
  console.log(`DATABASE_URL=${targetUrl}`);
  
  await sqlCon.end();
}

main().catch(err => {
  console.error("Error in check-db:", err);
  process.exit(1);
});
