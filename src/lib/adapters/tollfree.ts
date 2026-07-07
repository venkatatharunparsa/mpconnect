/**
 * Toll-free voice line adapter socket.
 * Production: Exotel (or Twilio) streams caller audio to this interface;
 * the same intake + extractSubmission path handles web and PSTN callers.
 */
export interface TollFreeAdapter {
  /** Fired when an inbound call connects. */
  onCall(handler: (session: TollFreeCallSession) => void): void;
  /** Send synthesized or bridged audio to the caller. */
  sendAudio(sessionId: string, audioChunk: ArrayBuffer): void;
  /** Hang up. */
  endCall(sessionId: string): void;
}

export interface TollFreeCallSession {
  sessionId: string;
  callerNumber: string;
  onAudio: (handler: (chunk: ArrayBuffer) => void) => void;
}

/**
 * Exotel stub — plug real credentials when the toll-free number arrives.
 *
 * When live:
 * 1. Set EXOTEL_SID, EXOTEL_TOKEN, EXOTEL_APP_ID in env.
 * 2. Point Exotel voice URL to POST /api/adapters/exotel/voice (Person A route).
 * 3. Bridge Exotel media stream ↔ TollFreeAdapter.sendAudio / onAudio.
 * 4. Reuse extractSubmission on the accumulated transcript at call end.
 */
export class ExotelAdapter implements TollFreeAdapter {
  onCall(_handler: (session: TollFreeCallSession) => void): void {
    // Stub: no PSTN line configured for hackathon demo.
    console.warn("[ExotelAdapter] stub — configure EXOTEL_* env vars to enable");
  }

  sendAudio(_sessionId: string, _audioChunk: ArrayBuffer): void {
    // no-op until Exotel stream is wired
  }

  endCall(_sessionId: string): void {
    // no-op
  }
}

export const tollFreeAdapter: TollFreeAdapter = new ExotelAdapter();
