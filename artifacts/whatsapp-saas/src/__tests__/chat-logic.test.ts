import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { EvolutionMessageRaw, EvolutionChatRaw, Conversation } from '@/types/chat';

// vi.mock is hoisted — must appear before the imports that use the mock
vi.mock('@/services/evolution.service', () => ({
  getEvolutionClient: vi.fn(),
}));

import { getEvolutionClient } from '@/services/evolution.service';
import {
  isPlausiblePhoneNumber,
  resolvePhoneFromRawMessages,
  resolveSendAddress,
  findChats,
} from '@/services/chat.service';

// ─── isPlausiblePhoneNumber ────────────────────────────────────────────────────

describe('isPlausiblePhoneNumber', () => {
  it('aceita número brasileiro de 13 dígitos', () => {
    expect(isPlausiblePhoneNumber('5511999999999')).toBe(true);
  });

  it('aceita quando vem com sufixo @s.whatsapp.net', () => {
    expect(isPlausiblePhoneNumber('5511999999999@s.whatsapp.net')).toBe(true);
  });

  it('aceita número de 10 dígitos (mínimo internacional)', () => {
    expect(isPlausiblePhoneNumber('5511999999')).toBe(true);
  });

  it('rejeita LID de 15 dígitos sem sufixo', () => {
    expect(isPlausiblePhoneNumber('120074904043619')).toBe(false);
  });

  it('rejeita LID de 15 dígitos disfarçado como @s.whatsapp.net', () => {
    expect(isPlausiblePhoneNumber('120074904043619@s.whatsapp.net')).toBe(false);
  });

  it('rejeita número com apenas 9 dígitos (curto demais)', () => {
    expect(isPlausiblePhoneNumber('551199999')).toBe(false);
  });

  it('rejeita string vazia', () => {
    expect(isPlausiblePhoneNumber('')).toBe(false);
  });
});

// ─── resolvePhoneFromRawMessages ───────────────────────────────────────────────

describe('resolvePhoneFromRawMessages', () => {
  it('retorna telefone de remoteJidAlt quando presente (chat LID)', () => {
    const msgs: EvolutionMessageRaw[] = [
      {
        key: {
          remoteJid: '120074904043619@s.whatsapp.net',
          fromMe: false,
          id: 'msg1',
          remoteJidAlt: '5511999999999@s.whatsapp.net',
        },
      },
    ];
    expect(resolvePhoneFromRawMessages(msgs)).toBe('5511999999999');
  });

  it('remove o sufixo de domínio do remoteJidAlt', () => {
    const msgs: EvolutionMessageRaw[] = [
      {
        key: {
          remoteJid: '120074904043619@s.whatsapp.net',
          fromMe: false,
          id: 'msg1',
          remoteJidAlt: '5511888888888@s.whatsapp.net',
        },
      },
    ];
    expect(resolvePhoneFromRawMessages(msgs)).toBe('5511888888888');
  });

  it('usa remoteJid como fallback quando não há remoteJidAlt e o JID é telefone válido', () => {
    const msgs: EvolutionMessageRaw[] = [
      {
        key: {
          remoteJid: '5511999999999@s.whatsapp.net',
          fromMe: false,
          id: 'msg1',
        },
      },
    ];
    expect(resolvePhoneFromRawMessages(msgs)).toBe('5511999999999');
  });

  it('retorna null para mensagens LID sem remoteJidAlt', () => {
    const msgs: EvolutionMessageRaw[] = [
      {
        key: {
          remoteJid: '120074904043619@s.whatsapp.net',
          fromMe: false,
          id: 'msg1',
        },
      },
    ];
    expect(resolvePhoneFromRawMessages(msgs)).toBeNull();
  });

  it('retorna null para array vazio', () => {
    expect(resolvePhoneFromRawMessages([])).toBeNull();
  });

  it('prefere a primeira mensagem que tem remoteJidAlt válido, ignorando as anteriores sem ele', () => {
    const msgs: EvolutionMessageRaw[] = [
      {
        key: { remoteJid: '120074904043619@s.whatsapp.net', fromMe: false, id: 'msg1' },
      },
      {
        key: {
          remoteJid: '120074904043619@s.whatsapp.net',
          fromMe: true,
          id: 'msg2',
          remoteJidAlt: '5511777777777@s.whatsapp.net',
        },
      },
    ];
    expect(resolvePhoneFromRawMessages(msgs)).toBe('5511777777777');
  });
});

// ─── resolveSendAddress ────────────────────────────────────────────────────────

const baseChatUser = {
  name: 'Test',
  profilePicUrl: null as null,
  pushName: null as null,
  isOnline: false,
  lastSeen: null as null,
  tags: [] as string[],
  notes: '',
  origin: 'WhatsApp',
  firstContactAt: null as null,
};

function makeConversation(overrides: Partial<Conversation>): Conversation {
  return {
    id: '5511999999999@s.whatsapp.net',
    instanceName: 'test',
    contact: {
      ...baseChatUser,
      remoteJid: '5511999999999@s.whatsapp.net',
      phone: '5511999999999',
    },
    lastMessage: null,
    unreadCount: 0,
    status: 'OPEN',
    isFavorite: false,
    updatedAt: new Date('2024-01-10T10:00:00Z'),
    ...overrides,
  };
}

describe('resolveSendAddress', () => {
  it('retorna "{lid}@lid" para conversa com ID LID de 15 dígitos', () => {
    const conv = makeConversation({
      id: '120074904043619@s.whatsapp.net',
      contact: {
        ...baseChatUser,
        remoteJid: '120074904043619@s.whatsapp.net',
        phone: '5511999999999',
      },
    });
    expect(resolveSendAddress(conv)).toBe('120074904043619@lid');
  });

  it('retorna contact.phone para conversa com JID de telefone normal', () => {
    const conv = makeConversation({});
    expect(resolveSendAddress(conv)).toBe('5511999999999');
  });

  it('não usa o telefone resolvido do contato para enviar ao chat LID (evita split de histórico)', () => {
    const conv = makeConversation({
      id: '120074904043619@s.whatsapp.net',
      contact: {
        ...baseChatUser,
        remoteJid: '120074904043619@s.whatsapp.net',
        phone: '5511999999999',
      },
    });
    // deve usar @lid, nunca o telefone real
    expect(resolveSendAddress(conv)).not.toBe('5511999999999');
  });
});

// ─── findChats — lógica de deduplicação ───────────────────────────────────────

describe('findChats — deduplicação', () => {
  let mockPost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockPost = vi.fn();
    (getEvolutionClient as ReturnType<typeof vi.fn>).mockReturnValue({ post: mockPost });
  });

  it('mantém o chat LID quando LID e phone-JID compartilham o mesmo telefone', async () => {
    const lidChat: EvolutionChatRaw = {
      remoteJid: '120074904043619@s.whatsapp.net',
      updatedAt: new Date('2024-01-10T10:00:00Z').toISOString(),
      lastMessage: {
        key: {
          remoteJid: '120074904043619@s.whatsapp.net',
          fromMe: false,
          id: 'msg-lid',
          remoteJidAlt: '5511999999999@s.whatsapp.net',
        },
        messageTimestamp: 1704880800,
      },
    };
    const phoneChat: EvolutionChatRaw = {
      remoteJid: '5511999999999@s.whatsapp.net',
      updatedAt: new Date('2024-01-09T10:00:00Z').toISOString(),
    };

    mockPost.mockResolvedValue({ data: [phoneChat, lidChat] });

    const result = await findChats('test-instance');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('120074904043619@s.whatsapp.net');
    // telefone do contato deve ter sido resolvido via remoteJidAlt
    expect(result[0].contact.phone).toBe('5511999999999');
  });

  it('mantém o chat LID mesmo quando ele é mais antigo que o phone-JID', async () => {
    const lidChat: EvolutionChatRaw = {
      remoteJid: '120074904043619@s.whatsapp.net',
      updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
      lastMessage: {
        key: {
          remoteJid: '120074904043619@s.whatsapp.net',
          fromMe: false,
          id: 'msg-lid',
          remoteJidAlt: '5511999999999@s.whatsapp.net',
        },
      },
    };
    const phoneChat: EvolutionChatRaw = {
      remoteJid: '5511999999999@s.whatsapp.net',
      updatedAt: new Date('2024-01-15T00:00:00Z').toISOString(),
    };

    mockPost.mockResolvedValue({ data: [phoneChat, lidChat] });

    const result = await findChats('test-instance');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('120074904043619@s.whatsapp.net');
  });

  it('mantém ambos os chats quando têm telefones diferentes', async () => {
    const chat1: EvolutionChatRaw = {
      remoteJid: '5511999999999@s.whatsapp.net',
      updatedAt: new Date('2024-01-10T10:00:00Z').toISOString(),
    };
    const chat2: EvolutionChatRaw = {
      remoteJid: '5511888888888@s.whatsapp.net',
      updatedAt: new Date('2024-01-09T10:00:00Z').toISOString(),
    };

    mockPost.mockResolvedValue({ data: [chat1, chat2] });

    const result = await findChats('test-instance');

    expect(result).toHaveLength(2);
    const ids = result.map((c) => c.id);
    expect(ids).toContain('5511999999999@s.whatsapp.net');
    expect(ids).toContain('5511888888888@s.whatsapp.net');
  });

  it('mantém o mais recente quando dois phone-JIDs têm o mesmo telefone (caso de edge)', async () => {
    // Dois chats distintos com o mesmo JID — raro na prática mas cobre o branch
    // "ambos não-LID com mesmo phone, mantém o mais recente"
    const older: EvolutionChatRaw = {
      remoteJid: '5511999999999@s.whatsapp.net',
      updatedAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    };
    const newer: EvolutionChatRaw = {
      remoteJid: '5511999999999@s.whatsapp.net',
      updatedAt: new Date('2024-01-10T10:00:00Z').toISOString(),
    };

    mockPost.mockResolvedValue({ data: [older, newer] });

    const result = await findChats('test-instance');

    expect(result).toHaveLength(1);
    expect(result[0].updatedAt.toISOString()).toContain('2024-01-10');
  });

  it('lista é ordenada do mais recente para o mais antigo', async () => {
    const chat1: EvolutionChatRaw = {
      remoteJid: '5511111111111@s.whatsapp.net',
      updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    };
    const chat2: EvolutionChatRaw = {
      remoteJid: '5522222222222@s.whatsapp.net',
      updatedAt: new Date('2024-01-20T00:00:00Z').toISOString(),
    };
    const chat3: EvolutionChatRaw = {
      remoteJid: '5533333333333@s.whatsapp.net',
      updatedAt: new Date('2024-01-10T00:00:00Z').toISOString(),
    };

    mockPost.mockResolvedValue({ data: [chat1, chat2, chat3] });

    const result = await findChats('test-instance');

    expect(result[0].id).toBe('5522222222222@s.whatsapp.net');
    expect(result[1].id).toBe('5533333333333@s.whatsapp.net');
    expect(result[2].id).toBe('5511111111111@s.whatsapp.net');
  });

  it('filtra JIDs inválidos (status broadcast, string vazia)', async () => {
    const validChat: EvolutionChatRaw = {
      remoteJid: '5511999999999@s.whatsapp.net',
      updatedAt: new Date('2024-01-10T10:00:00Z').toISOString(),
    };
    const statusBroadcast: EvolutionChatRaw = {
      remoteJid: 'status@broadcast',
    };
    const emptyJid: EvolutionChatRaw = {
      remoteJid: '',
    };

    mockPost.mockResolvedValue({ data: [validChat, statusBroadcast, emptyJid] });

    const result = await findChats('test-instance');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('5511999999999@s.whatsapp.net');
  });
});
