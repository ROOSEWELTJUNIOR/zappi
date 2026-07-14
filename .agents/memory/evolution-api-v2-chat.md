---
name: Evolution API v2 Chat Endpoints
description: Correct endpoint methods and response shapes for chat operations in Evolution API v2.x (confirmed on v2.3.7 Railway instance).
---

## findChats
- **Method**: `POST /chat/findChats/{instanceName}` (NOT GET — GET returns 404)
- **Body**: `{}` (empty object for all chats)
- **Response**: Array of chat objects with this shape:
  ```json
  {
    "id": "cmrl...",          // internal DB id — NOT the JID
    "remoteJid": "..@lid",    // actual WhatsApp JID
    "pushName": null,
    "profilePicUrl": "https://...",
    "updatedAt": "2026-07-14T10:24:32.000Z",  // ISO string (not epoch)
    "windowStart": "...",
    "windowExpires": "...",
    "windowActive": true,
    "lastMessage": { key, message, messageTimestamp, status }
  }
  ```

## JID Formats
WhatsApp JIDs can be:
- `@s.whatsapp.net` — individual contact
- `@g.us` — group chat
- `@lid` — new WhatsApp linked-ID format (valid, must be accepted)

`status@broadcast` must be filtered out.

## findMessages
- **Method**: `POST /chat/findMessages/{instanceName}`
- **Body**: `{ where: { key: { remoteJid: "..." } }, limit: 40, page: 1 }`
- **Fallback**: `GET /message/findMessages/{instanceName}?remoteJid=...&limit=40&page=1`

## sendText
- **Method**: `POST /message/sendText/{instanceName}`
- **Body**: `{ number: "5511999999999", text: "Hello" }` (number = digits only, no @suffix)

**Why:** Evolution API v2.x changed chat routes from GET to POST to support filter bodies. Not documented anywhere obvious — discovered by 404 debugging on live instance.

**How to apply:** Any new chat-related endpoint — try POST first if GET returns 404.
