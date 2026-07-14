/**
 * Message service — sending and managing individual messages.
 * Uses the singleton axios client from evolution.service (never recreates it).
 */
import { getEvolutionClient } from '@/services/evolution.service';
import { normaliseMessage } from '@/services/chat.service';
import type { Message, EvolutionMessageRaw } from '@/types/chat';

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
