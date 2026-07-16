/**
 * Message service — sending and managing individual messages.
 * Uses the singleton axios client from evolution.service (never recreates it).
 *
 * Exports:
 *  sendText()                  — plain text message (unchanged)
 *  sendMedia()                 — image / video / audio / document via Evolution API
 *  buildOptimisticMessage()    — optimistic text message (unchanged)
 *  buildOptimisticMediaMessage()— optimistic media message for immediate UI render
 */
import { getEvolutionClient } from '@/services/evolution.service';
import { normaliseMessage } from '@/services/chat.service';
import type { Message, EvolutionMessageRaw } from '@/types/chat';
import type { MediaCategory } from '@/services/storage/interfaces/StorageFile';

// ─── sendText (unchanged from original) ──────────────────────────────────────

export interface SendTextResult {
  message: Message;
}

/**
 * Send a plain-text WhatsApp message.
 * `number` should be the raw phone digits (e.g. "5511999999999") — NOT the JID.
 */
export async function sendText(
  instanceName: string,
  number: string,
  text: string,
): Promise<Message> {
  const client = getEvolutionClient();
  const { data } = await client.post<EvolutionMessageRaw>(
    `/message/sendText/${instanceName}`,
    { number, text },
  );
  return normaliseMessage(data, instanceName);
}

/**
 * Build an optimistic Message so the UI can render immediately while
 * the API call is in-flight. The id is a temporary client-side ID.
 */
export function buildOptimisticMessage(
  remoteJid: string,
  text: string,
  instanceName: string,
): Message {
  return {
    id: `optimistic-${Date.now()}-${Math.random()}`,
    remoteJid,
    fromMe: true,
    content: text,
    type: 'text',
    timestamp: new Date(),
    status: 'PENDING',
    instanceName,
  };
}

// ─── sendMedia ────────────────────────────────────────────────────────────────

export interface SendMediaPayload {
  instanceName: string;
  /** Raw phone number, e.g. "5511999999999" (no @s.whatsapp.net). */
  number: string;
  /** Broad media category understood by the Evolution API. */
  mediatype: MediaCategory;
  /** MIME type of the file, e.g. "image/jpeg". */
  mimetype: string;
  /**
   * Either:
   *   • A public HTTPS URL (when using S3 or any remote storage), or
   *   • A raw base64 string WITHOUT the "data:…;base64," prefix
   *     (when using the Base64Provider fallback).
   */
  media: string;
  /** Optional caption shown below the media. */
  caption?: string;
  /** Required when mediatype is 'document'. */
  fileName?: string;
  /** True for WhatsApp voice notes (push-to-talk). Defaults to false. */
  ptt?: boolean;
}

/**
 * Send a media message via the Evolution API.
 * Works with both remote URLs (S3) and raw base64 strings.
 */
export async function sendMedia(payload: SendMediaPayload): Promise<Message> {
  const client = getEvolutionClient();

  const body: Record<string, unknown> = {
    number:    payload.number,
    mediatype: payload.mediatype,
    mimetype:  payload.mimetype,
    media:     payload.media,
  };

  if (payload.caption)  body.caption  = payload.caption;
  if (payload.fileName) body.fileName = payload.fileName;
  if (payload.ptt != null) body.ptt   = payload.ptt;

  const { data } = await client.post<EvolutionMessageRaw>(
    `/message/sendMedia/${payload.instanceName}`,
    body,
  );
  return normaliseMessage(data, payload.instanceName);
}

// ─── buildOptimisticMediaMessage ──────────────────────────────────────────────

/**
 * Build an optimistic media Message for immediate UI feedback.
 * Uses the local object URL (blob:) or data URI as the preview source so the
 * user sees the image / video instantly without waiting for the API round-trip.
 */
export function buildOptimisticMediaMessage(
  remoteJid:    string,
  instanceName: string,
  category:     MediaCategory,
  mimetype:     string,
  localUrl:     string,
  caption:      string,
  fileName:     string,
  fileSize:     number,
): Message {
  // Map MediaCategory → MessageType
  const typeMap: Record<MediaCategory, Message['type']> = {
    image:    'image',
    video:    'video',
    audio:    'audio',
    document: 'document',
  };

  return {
    id:         `optimistic-${Date.now()}-${Math.random()}`,
    remoteJid,
    fromMe:     true,
    content:    caption || fileName,
    type:       typeMap[category],
    attachment: {
      type:     typeMap[category] as 'image' | 'video' | 'audio' | 'document',
      url:      localUrl,
      mimetype,
      fileName,
      caption:  caption || undefined,
      fileSize,
    },
    timestamp:  new Date(),
    status:     'PENDING',
    instanceName,
  };
}
