import type { Bot } from "grammy";
import { createTelegramBot } from "@/server/adapters/telegram-bot";
import { isDuplicateUpdate } from "@/server/adapters/telegram-helpers";

export const runtime = "nodejs";

let bot: Bot | null = null;

function getBot(): Bot {
  if (!bot) bot = createTelegramBot();
  return bot;
}

export async function POST(req: Request) {
  try {
    const update = await req.json();
    if (typeof update.update_id === "number" && isDuplicateUpdate(update.update_id)) {
      return new Response("OK", { status: 200 });
    }
    await getBot().handleUpdate(update);
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return new Response("Error", { status: 500 });
  }
}
