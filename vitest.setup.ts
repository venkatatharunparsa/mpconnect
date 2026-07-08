import fs from "fs";
import path from "path";

try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, "");
        process.env[key] = value;
      }
    }
  }
} catch (err) {
  console.error("Failed to load .env.local:", err);
}

// Force mock AI client during tests to prevent rate limits and ensure fast, offline runs
process.env.GEMINI_API_KEY = "mock";
process.env.DATABASE_URL ??= "postgresql://postgres@localhost:5432/mpconnect";


