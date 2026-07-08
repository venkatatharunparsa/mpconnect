/**
 * Register Telegram webhook → $PUBLIC_URL/api/telegram
 * Run: pnpm tsx scripts/set-telegram-webhook.ts
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

function loadEnv() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

async function main() {
  loadEnv();
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const publicUrl = process.env.PUBLIC_URL;
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN not set");
    process.exit(1);
  }
  if (!publicUrl) {
    console.error("PUBLIC_URL not set (e.g. https://your-app.vercel.app)");
    process.exit(1);
  }

  const webhookUrl = `${publicUrl.replace(/\/$/, "")}/api/telegram`;
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl }),
  });
  const data = await res.json();
  console.log("setWebhook:", data);
  if (!data.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
