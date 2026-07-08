import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Dependency-free environment variables loader for seed scripts
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
