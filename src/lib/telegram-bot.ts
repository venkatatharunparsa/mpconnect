import { Bot } from "grammy";
import { extractSubmission } from "@/lib/gemini";
import {
  apiBase,
  markVerificationPrompted,
  TELEGRAM_SAFETY_NOTICE,
  telegramCitizenKey,
  wasVerificationPrompted,
} from "@/lib/telegram-helpers";
import { isValidRefIdFormat } from "@/lib/refid";

function getToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return token;
}

async function downloadTelegramFile(
  bot: Bot,
  fileId: string,
): Promise<{ base64: string; mime: string }> {
  const file = await bot.api.getFile(fileId);
  if (!file.file_path) throw new Error("File path missing");
  const url = `https://api.telegram.org/file/bot${getToken()}/${file.file_path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to download Telegram file");
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = file.file_path.endsWith(".ogg")
    ? "audio/ogg"
    : file.file_path.match(/\.(jpg|jpeg|png|webp)$/i)
      ? `image/${file.file_path.split(".").pop() === "jpg" ? "jpeg" : file.file_path.split(".").pop()}`
      : "application/octet-stream";
  return { base64: buf.toString("base64"), mime };
}

async function postSubmission(body: Record<string, unknown>) {
  const res = await fetch(`${apiBase()}/api/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Submission failed");
  return data as { refId: string; status: string };
}

export function createTelegramBot(): Bot {
  const bot = new Bot(getToken());

  bot.command("start", async (ctx) => {
    await ctx.reply(TELEGRAM_SAFETY_NOTICE);
    const chatId = ctx.chat?.id;
    if (chatId) await maybePromptVerification(ctx, telegramCitizenKey(chatId));
  });

  bot.on("message", async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    const citizenKey = telegramCitizenKey(chatId);
    const text = ctx.message.text?.trim();

    if (text?.startsWith("/status")) {
      const refId = text.replace(/^\/status\s*/i, "").trim().toUpperCase();
      if (!isValidRefIdFormat(refId)) {
        await ctx.reply("Usage: /status VZG-2607-00001");
        return;
      }
      const res = await fetch(`${apiBase()}/api/submissions/${encodeURIComponent(refId)}`);
      const data = await res.json();
      if (!res.ok) {
        await ctx.reply(data.error ?? "Not found");
        return;
      }
      let reply = `Ref: ${refId}\nStatus: ${data.status}`;
      if (data.demand) {
        reply += `\nDemand: ${data.demand.title}\nState: ${data.demand.state}`;
      }
      await ctx.reply(reply);
      return;
    }

    if (text?.startsWith("/")) return;

    await maybePromptVerification(ctx, citizenKey);

    let extractionInput: Parameters<typeof extractSubmission>[0] = {};
    let rawText = text;

    if (ctx.message.voice) {
      const { base64, mime } = await downloadTelegramFile(bot, ctx.message.voice.file_id);
      extractionInput = { audioBase64: base64, audioMime: mime };
      rawText = "[telegram voice]";
    } else if (ctx.message.photo?.length) {
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const { base64, mime } = await downloadTelegramFile(bot, photo.file_id);
      extractionInput = {
        imageBase64: base64,
        imageMime: mime,
        text: ctx.message.caption,
      };
      rawText = ctx.message.caption ?? "[telegram photo]";
    } else if (text) {
      extractionInput = { text };
    } else {
      await ctx.reply("Send text, voice, or a photo describing your problem.");
      return;
    }

    await ctx.reply("Processing…");

    const result = await extractSubmission(extractionInput);
    if (result.needsHuman) {
      await ctx.reply("We could not extract details automatically. A reviewer will check your message.");
      return;
    }

    const { extraction } = result;
    const submitted = await postSubmission({
      channel: "telegram",
      citizenKey,
      rawText,
      lang: extraction.lang,
      extraction: {
        kind: extraction.kind,
        category: extraction.category,
        locationText: extraction.locationText,
        urgency: extraction.urgency,
        summaryEn: extraction.summaryEn,
        summaryTe: extraction.summaryTe,
        confidence: extraction.confidence,
      },
    });

    const summary =
      extraction.lang === "te" && extraction.summaryTe
        ? extraction.summaryTe
        : extraction.summaryEn;

    await ctx.reply(
      `${summary}\n\nమీ సమస్య నమోదైంది. Ref: ${submitted.refId}. Track anytime: /status ${submitted.refId}`,
    );

    await maybePromptVerification(ctx, citizenKey);
  });

  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    const chatId = ctx.chat?.id;
    if (!chatId || !data?.startsWith("verify:")) return;

    const [, verificationId, response] = data.split(":");
    if (!verificationId || (response !== "confirm" && response !== "deny")) return;

    const citizenKey = telegramCitizenKey(chatId);
    const res = await fetch(`${apiBase()}/api/verifications/${verificationId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response, citizenKey }),
    });
    const body = await res.json();
    await ctx.answerCallbackQuery();
    if (!res.ok) {
      await ctx.reply(body.error ?? "Could not record response");
      return;
    }
    await ctx.reply(
      response === "confirm"
        ? "✅ Thanks — marked as fixed."
        : "❌ Recorded — demand reopened for follow-up.",
    );
  });

  return bot;
}

async function maybePromptVerification(
  ctx: { chat?: { id: number }; reply: (text: string, extra?: object) => Promise<unknown> },
  citizenKey: string,
) {
  const res = await fetch(`${apiBase()}/api/verifications?citizenKey=${encodeURIComponent(citizenKey)}`);
  if (!res.ok) return;
  const pending = (await res.json()) as Array<{ id: number; demandTitle: string }>;
  if (!pending.length) return;

  const v = pending[0];
  if (wasVerificationPrompted(ctx.chat!.id, v.id)) return;

  markVerificationPrompted(ctx.chat!.id, v.id);
  await ctx.reply(`Was this fixed? — ${v.demandTitle}`, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Fixed", callback_data: `verify:${v.id}:confirm` },
          { text: "❌ Not fixed", callback_data: `verify:${v.id}:deny` },
        ],
      ],
    },
  });
}
