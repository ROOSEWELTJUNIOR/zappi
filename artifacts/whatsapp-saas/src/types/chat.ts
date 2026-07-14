/**
 * Chat module — type definitions.
 * Raw Evolution API shapes for chats/messages and normalised UI models.
 * UI components only import from this file, never raw API types directly.
 */

// ─── Raw Evolution API shapes ─────────────────────────────────────────────────

export interface EvolutionMessageKey {
  remoteJid: string;
  fromMe: boolean;
  id: string;
}

export type EvolutionRawStatus =
  | 'ERROR'
  | 'PENDING'
  | 'SERVER_ACK'
  | 'DELIVERY_ACK'
  | 'READ'
  | 'PLAYED'
  | string;

export interface EvolutionMessageContent {
  conversation?: string;
  extendedTextMessage?: { text: string; contextInfo?: unknown };
  imageMessage?: {
    caption?: string;
    mimetype?: string;
    url?: string;
    base64?: string;
  };
  videoMessage?: { caption?: string; mimetype?: string; url?: string };
  audioMessage?: { mimetype?: string; url?: string; ptt?: boolean };
  documentMessage?: {
    fileName?: string;
    mimetype?: string;
    url?: string;
    title?: string;
  };
  stickerMessage?: { mimetype?: string; url?: string };
  locationMessage?: {
    degreesLatitude?: number;
    degreesLongitude?: number;
    name?: string;
    address?: string;
  };
  contactMessage?: { displayName?: string; vcard?: string };
  reactionMessage?: { text?: string; key?: EvolutionMessageKey };
}

export interface EvolutionMessageRaw {
  key: EvolutionMessageKey;
  message?: EvolutionMessageContent;
  messageTimestamp?: number | string;
  status?: EvolutionRawStatus;
  pushName?: string;
  mediaUrl?: string;
  id?: string;
}

export interface EvolutionChatLastMessage {
  key?: EvolutionMessageKey;
  message?: EvolutionMessageContent;
  messageTimestamp?: number | string;
  status?: string;
  pushName?: string;
}

/**
 * Chat object as returned by POST /chat/findChats/{instance} in Evolution API v2.x.
 * NOTE: `id` is the internal database ID — the JID is in `remoteJid`.
 */
export interface EvolutionChatRaw {
  id?: string;               // internal DB id (not JID)
  remoteJid?: string;        // the actual WhatsApp JID (may be @s.whatsapp.net, @g.us, or @lid)
  name?: string;             // stored display name
  pushName?: string;         // WhatsApp push name from the contact
  profilePicUrl?: string | null;
  updatedAt?: string;        // ISO date string from Evolution store
  unreadMessages?: number;
  unreadCount?: number;      // alternate key name
  windowStart?: string;
  windowExpires?: string;
  windowActive?: boolean;
  lastMessage?: EvolutionChatLastMessage | null;
}

export interface EvolutionFindMessagesResponse {
  messages?: {
    total?: number;
    pages?: number;
    currentPage?: number;
    records?: EvolutionMessageRaw[];
  };
  // Some versions return records at root
  records?: EvolutionMessageRaw[];
}

// ─── UI model types ───────────────────────────────────────────────────────────

export type ChatStatus = 'OPEN' | 'CLOSED' | 'PENDING';

export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ';

export type MessageType =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contact'
  | 'reaction'
  | 'unknown';

export type ChatFilter = 'ALL' | 'UNREAD' | 'OPEN' | 'CLOSED' | 'FAVORITE';

// ─── UI models ────────────────────────────────────────────────────────────────

export interface Attachment {
  type: 'image' | 'audio' | 'video' | 'document' | 'sticker';
  url?: string;
  mimetype?: string;
  fileName?: string;
  caption?: string;
  base64?: string;
}

export interface ChatUser {
  remoteJid: string;
  name: string;
  phone: string;
  profilePicUrl: string | null;
  pushName: string | null;
  isOnline: boolean;
  lastSeen: Date | null;
  tags: string[];
  notes: string;
  origin: string;
  firstContactAt: Date | null;
}

export interface Message {
  id: string;
  remoteJid: string;
  fromMe: boolean;
  content: string;
  type: MessageType;
  attachment?: Attachment;
  timestamp: Date;
  status: MessageStatus;
  instanceName: string;
  pushName?: string;
}

export interface Conversation {
  id: string;           // remoteJid
  instanceName: string;
  contact: ChatUser;
  lastMessage: Message | null;
  unreadCount: number;
  status: ChatStatus;
  isFavorite: boolean;
  updatedAt: Date;
}

export interface SendTextPayload {
  instanceName: string;
  remoteJid: string;
  text: string;
}
