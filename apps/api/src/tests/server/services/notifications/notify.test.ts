import { describe, it, expect, vi, beforeEach } from "vitest";
import { notifyCitizen } from "@/server/services/notifications/notify";

const mockSendMessage = vi.fn().mockResolvedValue({ message_id: 123 });

vi.mock("grammy", () => {
  return {
    Bot: vi.fn().mockImplementation(() => {
      return {
        api: {
          sendMessage: mockSendMessage,
        },
      };
    }),
  };
});

describe("notify", () => {
  beforeEach(() => {
    mockSendMessage.mockClear();
    process.env.TELEGRAM_BOT_TOKEN = "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ";
  });

  it("proactively sends a Telegram message when notifyCitizen is called", async () => {
    const success = await notifyCitizen("telegram:555666", "validated", { refId: "VZG-2607-00001" });
    expect(success).toBe(true);
    expect(mockSendMessage).toHaveBeenCalledWith(
      555666,
      expect.stringContaining("VZG-2607-00001"),
      expect.any(Object)
    );
  });

  it("silently no-ops for non-Telegram channels", async () => {
    const success = await notifyCitizen("web:12345", "validated", { refId: "VZG-2607-00001" });
    expect(success).toBe(true);
    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});
