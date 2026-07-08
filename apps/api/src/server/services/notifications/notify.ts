import { Bot } from "grammy";
import { getSubmissionsByDemandId } from "@/server/repositories/submission";

let botInstance: Bot | null = null;

function getTelegramBot(): Bot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.startsWith("mock") || token === "") {
    return null;
  }
  if (!botInstance) {
    botInstance = new Bot(token);
  }
  return botInstance;
}

export async function notifyCitizen(
  citizenKey: string,
  event: "validated" | "routed" | "fix_claimed" | "resolved_verified" | "resolved_unverified" | "reopened",
  payload: {
    refId?: string;
    authorityName?: string;
    demandTitle?: string;
    verificationId?: number;
  }
): Promise<boolean> {
  console.log(`[Notification] Triggered for citizen: ${citizenKey}, event: ${event}, payload:`, payload);

  if (!citizenKey.startsWith("telegram:")) {
    // Silently no-op for non-telegram channels as per Task 1 specifications
    return true;
  }

  const chatIdStr = citizenKey.replace("telegram:", "");
  const chatId = parseInt(chatIdStr, 10);
  if (isNaN(chatId)) {
    console.error(`[Notification] Invalid telegram chatId extracted from key: ${citizenKey}`);
    return false;
  }

  const bot = getTelegramBot();
  if (!bot) {
    console.log(`[Notification] Bot not configured or mock mode. Simulated message sent to ${chatId}`);
    return true;
  }

  let text = "";
  let options: any = {};

  switch (event) {
    case "validated":
      text = `మీ నివేదిక (Ref: ${payload.refId ?? ""}) ధృవీకరించబడింది మరియు పరిశీలించబడుతోంది.\n\nYour report (Ref: ${payload.refId ?? ""}) has been validated.`;
      break;
    case "routed":
      text = `మీ నివేదిక (Ref: ${payload.refId ?? ""}) సంబంధిత అధికారి (${payload.authorityName ?? "అధికారి"}) కి పంపబడింది.\n\nYour report (Ref: ${payload.refId ?? ""}) has been routed to: ${payload.authorityName ?? "Authority"}.`;
      break;
    case "fix_claimed":
      text = `సమస్య పరిష్కరించబడిందా? / Was this fixed? — ${payload.demandTitle ?? ""}`;
      if (payload.verificationId) {
        options.reply_markup = {
          inline_keyboard: [
            [
              { text: "✅ అవును / Yes", callback_data: `verify:${payload.verificationId}:confirm` },
              { text: "❌ లేదు / No", callback_data: `verify:${payload.verificationId}:deny` },
            ],
          ],
        };
      }
      break;
    case "resolved_verified":
      text = `మీ నివేదిక (Ref: ${payload.refId ?? ""}) పరిష్కరించబడింది (ధృవీకరించబడింది).\n\nYour report (Ref: ${payload.refId ?? ""}) is successfully resolved (verified).`;
      break;
    case "resolved_unverified":
      text = `మీ నివేదిక (Ref: ${payload.refId ?? ""}) పరిష్కరించబడినట్లుగా గుర్తించబడింది.\n\nYour report (Ref: ${payload.refId ?? ""}) is closed as resolved.`;
      break;
    case "reopened":
      text = `మీ నివేదిక (Ref: ${payload.refId ?? ""}) మళ్ళీ తెరవబడింది.\n\nYour report (Ref: ${payload.refId ?? ""}) has been reopened.`;
      break;
  }

  try {
    await bot.api.sendMessage(chatId, text, options);
    console.log(`[Notification] Successfully sent Telegram message to ${chatId}`);
    return true;
  } catch (err) {
    console.error(`[Notification] Failed to send Telegram message to ${chatId}:`, err);
    return false;
  }
}

export async function notifyReportersForDemand(
  demandId: string,
  event: "validated" | "routed" | "fix_claimed" | "resolved_verified" | "resolved_unverified" | "reopened",
  extra?: { authorityName?: string; demandTitle?: string; verificationId?: number }
) {
  const subs = await getSubmissionsByDemandId(demandId);
  for (const sub of subs) {
    if (sub.citizenKey) {
      await notifyCitizen(sub.citizenKey, event, {
        refId: sub.refId,
        ...extra,
      });
    }
  }
}
