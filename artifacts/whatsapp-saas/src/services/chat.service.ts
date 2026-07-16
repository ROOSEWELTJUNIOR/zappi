/**
 * Chat service — all chat-related Evolution API calls.
 * Uses the singleton axios client from evolution.service (never recreates it).
 * Never import axios directly; always call getEvolutionClient().
 */
import { getEvolutionClient } from '@/services/evolution.service';
import type {
  EvolutionChatRaw,
  EvolutionMessageRaw,
  EvolutionFindMessagesResponse,
  EvolutionMessageContent,
  Message,
  MessageStatus,
  MessageType,
  Attachment,
  Conversation,
  ChatUser,
  ChatStatus,
} from '@/types/chat';

// ─── Utility helpers ──────────────────────────────────────────────────────────

/** Strip @s.whatsapp.net / @g.us from a JID to get the raw phone number. */
export function jidToPhone(remoteJid: string): string {
  return remoteJid.replace(/@.*$/, '');
}

/** Derive a display name from a JID (fallback to formatted phone). */
export function jidToDisplayName(remoteJid: string, fallback?: string): string {
  if (fallback) return fallback;
  const phone = jidToPhone(remoteJid);
  // Format Brazilian numbers: 5511999999999 → +55 (11) 99999-9999
  if (phone.length === 13 && phone.startsWith('55')) {
    return `+55 (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
  }
  return `+${phone}`;
}

/** Whether a JID is a group chat. */
export function isGroupJid(remoteJid: string): boolean {
  return remoteJid.endsWith('@g.us');
}

/**
 * Whether a JID is valid for display.
 * Accepts @s.whatsapp.net (individual), @g.us (group), @lid (new linked-ID format).
 * Excludes status broadcasts and empty strings.
 */
export function isValidChatJid(remoteJid: string): boolean {
  if (!remoteJid) return false;
  if (remoteJid.startsWith('status@')) return false;
  return (
    remoteJid.endsWith('@s.whatsapp.net') ||
    remoteJid.endsWith('@g.us') ||
    remoteJid.endsWith('@lid')     // new WhatsApp linked-ID format
  );
}

// ─── Message adapters ─────────────────────────────────────────────────────────

function normaliseMessageType(content: EvolutionMessageContent | undefined): MessageType {
  if (!content) return 'unknown';
  if (content.conversation !== undefined || content.extendedTextMessage) return 'text';
  if (content.imageMessage) return 'image';
  if (content.audioMessage) return 'audio';
  // GIF: Evolution sends as videoMessage with gifPlayback=true
  if (content.videoMessage?.gifPlayback) return 'gif';
  if (content.videoMessage) return 'video';
  if (content.documentMessage) return 'document';
  if (content.stickerMessage) return 'sticker';
  if (content.locationMessage) return 'location';
  if (content.contactMessage) return 'contact';
  if (content.reactionMessage) return 'reaction';
  if (content.pollCreationMessage) return 'poll';
  return 'unknown';
}

function extractText(content: EvolutionMessageContent | undefined): string {
  if (!content) return '';
  return (
    content.conversation ??
    content.extendedTextMessage?.text ??
    content.imageMessage?.caption ??
    content.videoMessage?.caption ??
    content.documentMessage?.title ??
    content.documentMessage?.fileName ??
    content.locationMessage?.name ??
    content.locationMessage?.address ??
    content.contactMessage?.displayName ??
    content.pollCreationMessage?.name ??
    ''
  );
}

function extractAttachment(
  content: EvolutionMessageContent | undefined,
  type: MessageType,
): Attachment | undefined {
  if (!content) return undefined;

  switch (type) {
    case 'image':
      return {
        type: 'image',
        url: content.imageMessage?.url,
        mimetype: content.imageMessage?.mimetype,
        caption: content.imageMessage?.caption,
        base64: content.imageMessage?.base64,
        fileSize: content.imageMessage?.fileLength != null
          ? Number(content.imageMessage.fileLength)
          : undefined,
      };
    case 'audio':
      return {
        type: 'audio',
        url: content.audioMessage?.url,
        mimetype: content.audioMessage?.mimetype,
        ptt: content.audioMessage?.ptt ?? false,
        durationSecs: content.audioMessage?.seconds,
        fileSize: content.audioMessage?.fileLength != null
          ? Number(content.audioMessage.fileLength)
          : undefined,
      };
    case 'gif':
      return {
        type: 'gif',
        url: content.videoMessage?.url,
        mimetype: content.videoMessage?.mimetype,
        caption: content.videoMessage?.caption,
        gifPlayback: true,
        fileSize: content.videoMessage?.fileLength != null
          ? Number(content.videoMessage.fileLength)
          : undefined,
      };
    case 'video':
      return {
        type: 'video',
        url: content.videoMessage?.url,
        mimetype: content.videoMessage?.mimetype,
        caption: content.videoMessage?.caption,
        durationSecs: content.videoMessage?.seconds,
        fileSize: content.videoMessage?.fileLength != null
          ? Number(content.videoMessage.fileLength)
          : undefined,
      };
    case 'document':
      return {
        type: 'document',
        url: content.documentMessage?.url,
        mimetype: content.documentMessage?.mimetype,
        fileName: content.documentMessage?.fileName ?? content.documentMessage?.title,
        fileSize: content.documentMessage?.fileLength != null
          ? Number(content.documentMessage.fileLength)
          : undefined,
        pageCount: content.documentMessage?.pageCount,
      };
    case 'sticker':
      return {
        type: 'sticker',
        url: content.stickerMessage?.url,
        mimetype: content.stickerMessage?.mimetype,
      };
    // Location: store coordinates in attachment for MediaMessageLocation
    case 'location':
      return {
        type: 'image', // placeholder type; MediaMessageLocation reads the message directly
        latitude:  content.locationMessage?.degreesLatitude,
        longitude: content.locationMessage?.degreesLongitude,
      };
    default:
      return undefined;
  }
}

function normaliseMessageStatus(raw: string | undefined): MessageStatus {
  switch ((raw ?? '').toUpperCase()) {
    case 'SERVER_ACK':    return 'SENT';
    case 'DELIVERY_ACK':  return 'DELIVERED';
    case 'READ':
    case 'PLAYED':        return 'READ';
    default:              return 'PENDING';
  }
}

/** Convert a raw Evolution message to the UI Message model. */
export function normaliseMessage(
  raw: EvolutionMessageRaw,
  instanceName: string,
): Message {
  const type = normaliseMessageType(raw.message);
  return {
    id: raw.key.id,
    remoteJid: raw.key.remoteJid,
    fromMe: raw.key.fromMe,
    content: extractText(raw.message),
    type,
    attachment: extractAttachment(raw.message, type),
    timestamp: raw.messageTimestamp
      ? new Date(Number(raw.messageTimestamp) * 1000)
      : new Date(),
    status: normaliseMessageStatus(raw.status),
    instanceName,
    pushName: raw.pushName,
  };
}

function buildChatUser(jid: string, name?: string, pushName?: string): ChatUser {
  return {
    remoteJid: jid,
    name: name ?? pushName ?? jidToDisplayName(jid),
    phone: jidToPhone(jid),
    profilePicUrl: null,
    pushName: pushName ?? null,
    isOnline: false,
    lastSeen: null,
    tags: [],
    notes: '',
    origin: 'WhatsApp',
    firstContactAt: null,
  };
}

function normaliseChat(
  raw: EvolutionChatRaw,
  instanceName: string,
): Conversation | null {
  // In v2.x API: `id` is the DB primary key, `remoteJid` is the WhatsApp JID.
  // Fall back to `id` only if `remoteJid` is absent (shouldn't happen).
  const jid = raw.remoteJid ?? raw.id ?? '';
  if (!jid || !isValidChatJid(jid)) return null;

  const lastMsgRaw = raw.lastMessage;
  const lastMessage: Message | null = lastMsgRaw?.key
    ? normaliseMessage(
        {
          key: lastMsgRaw.key,
          message: lastMsgRaw.message,
          messageTimestamp: lastMsgRaw.messageTimestamp,
          status: lastMsgRaw.status,
          pushName: lastMsgRaw.pushName,
        },
        instanceName,
      )
    : null;

  // v2.x API exposes `updatedAt` as ISO string; fall back to last message time or now.
  const updatedAt = raw.updatedAt
    ? new Date(raw.updatedAt)
    : (lastMessage?.timestamp ?? new Date());

  // Prefer pushName (WhatsApp display name) → stored name → phone fallback
  const displayName = raw.pushName ?? raw.name ?? undefined;

  // Profile pic can come from the chat record directly in v2.x
  const contact = buildChatUser(jid, displayName, raw.pushName ?? undefined);
  contact.profilePicUrl = raw.profilePicUrl ?? null;

  // When the chat JID is @lid (WhatsApp Linked ID mode), jidToPhone() would return
  // the internal LID number (e.g. "120074904043619") which is NOT a phone number and
  // will be rejected by the Evolution API sendText/sendMedia endpoints with 400.
  // The real phone lives in the last message's key.remoteJid (always @s.whatsapp.net).
  const lastMsgKeyJid = raw.lastMessage?.key?.remoteJid;
  if (jid.endsWith('@lid') && lastMsgKeyJid && !lastMsgKeyJid.endsWith('@lid')) {
    contact.phone = jidToPhone(lastMsgKeyJid);
  }

  return {
    id: jid,
    instanceName,
    contact,
    lastMessage,
    unreadCount: raw.unreadMessages ?? raw.unreadCount ?? 0,
    status: 'OPEN' as ChatStatus,
    isFavorite: false,
    updatedAt,
  };
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Fetch all chats for an instance.
 *
 * Evolution API v2.x uses POST /chat/findChats/{instance} (not GET).
 * Filters out invalid JIDs (status broadcasts, groups without names, etc.).
 */
export async function findChats(instanceName: string): Promise<Conversation[]> {
  const client = getEvolutionClient();

  let raw: EvolutionChatRaw[] = [];

  // v2.x primary: POST with optional pagination/filter body
  try {
    const { data } = await client.post<EvolutionChatRaw[] | { chats?: EvolutionChatRaw[] }>(
      `/chat/findChats/${instanceName}`,
      {},
    );
    raw = Array.isArray(data)
      ? data
      : (data as { chats?: EvolutionChatRaw[] }).chats ?? [];
  } catch (postErr) {
    // v1.x fallback: GET (no body)
    try {
      const { data } = await client.get<EvolutionChatRaw[]>(
        `/chat/findChats/${instanceName}`,
      );
      raw = Array.isArray(data) ? data : [];
    } catch {
      // Both failed — re-throw the original POST error for the caller to handle
      throw postErr;
    }
  }

  return raw
    .map((r) => normaliseChat(r, instanceName))
    .filter((c): c is Conversation => c !== null)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

/**
 * Fetch paginated messages for a specific chat.
 * page is 1-indexed; limit is number of messages per page.
 */
export async function findMessages(
  instanceName: string,
  remoteJid: string,
  page = 1,
  limit = 40,
): Promise<Message[]> {
  const client = getEvolutionClient();

  // Try POST /chat/findMessages first (v2 primary endpoint)
  try {
    const { data } = await client.post<EvolutionFindMessagesResponse>(
      `/chat/findMessages/${instanceName}`,
      {
        where: { key: { remoteJid } },
        limit,
        page,
      },
    );

    const records =
      data?.messages?.records ??
      data?.records ??
      (Array.isArray(data) ? (data as EvolutionMessageRaw[]) : []);

    return records
      .map((r) => normaliseMessage(r, instanceName))
      .filter((m) => m.type !== 'unknown');
  } catch {
    // Fallback: GET /message/findMessages
    const { data } = await client.get<EvolutionFindMessagesResponse | EvolutionMessageRaw[]>(
      `/message/findMessages/${instanceName}`,
      { params: { remoteJid, limit, page } },
    );
    const records = Array.isArray(data)
      ? data
      : ((data as EvolutionFindMessagesResponse)?.messages?.records ?? []);
    return records
      .map((r) => normaliseMessage(r, instanceName))
      .filter((m) => m.type !== 'unknown');
  }
}

/** Mark a list of messages as read. */
export async function markAsRead(
  instanceName: string,
  messages: Array<{ remoteJid: string; id: string; fromMe: boolean }>,
): Promise<void> {
  if (!messages.length) return;
  const client = getEvolutionClient();
  await client.put(`/chat/readMessages/${instanceName}`, {
    readMessages: messages,
  });
}

/** Fetch profile picture URL for a contact (best-effort). */
export async function fetchContactPic(
  instanceName: string,
  number: string,
): Promise<string | null> {
  try {
    const client = getEvolutionClient();
    const { data } = await client.get<{ profilePictureUrl?: string; imgUrl?: string }>(
      `/contact/getProfilePicUrl/${instanceName}`,
      { params: { number } },
    );
    return data?.profilePictureUrl ?? data?.imgUrl ?? null;
  } catch {
    return null;
  }
}

/** Build a ChatUser from contact info (used in ContactPanel). */
export function buildContactUser(conversation: Conversation): ChatUser {
  return { ...conversation.contact };
}

/**
 * Fetch media content as a base64 data URI via Evolution API.
 * Used as fallback when the direct media URL is inaccessible (CORS / expired).
 */
export async function fetchMediaBase64(
  instanceName: string,
  messageId: string,
  remoteJid: string,
  fromMe: boolean,
): Promise<string | null> {
  try {
    const client = getEvolutionClient();
    const { data } = await client.post<{ base64?: string; mediaType?: string }>(
      `/message/getBase64FromMediaMessage/${instanceName}`,
      { message: { key: { id: messageId, fromMe, remoteJid } } },
    );
    if (!data?.base64) return null;
    const b64 = data.base64;
    if (b64.startsWith('data:')) return b64;
    const mime = data.mediaType ?? 'audio/ogg';
    return `data:${mime};base64,${b64}`;
  } catch {
    return null;
  }
}
