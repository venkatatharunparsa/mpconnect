import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";

/** Load `.env.local` from cwd or any parent directory (monorepo root). */
export function loadEnvLocal(startDir = process.cwd(), maxDepth = 6): string | null {
  let dir = startDir;
  for (let i = 0; i < maxDepth; i++) {
    const envLocalPath = join(dir, ".env.local");
    if (existsSync(envLocalPath)) {
      const envContent = readFileSync(envLocalPath, "utf-8");
      for (const line of envContent.split("\n")) {
        const matched = line.match(/^([^#=]+)=(.*)$/);
        if (matched && !process.env[matched[1].trim()]) {
          process.env[matched[1].trim()] = matched[2].trim().replace(/^["']|["']$/g, "");
        }
      }
      return envLocalPath;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}
