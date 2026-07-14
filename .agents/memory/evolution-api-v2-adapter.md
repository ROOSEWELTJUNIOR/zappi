---
name: Evolution API v2 Instance Adapter
description: The flat response shape from fetchInstances in Evolution API v2.x and how to normalise it.
---

## fetchInstances shape (v2.x)
```json
{
  "id": "uuid",
  "name": "instance-name",          // instanceName in v1 was nested: item.instance.instanceName
  "connectionStatus": "open",        // plain string in v2; was { state: "..." } object in v1
  "number": null,                    // phone; was item.phoneNumber in v1
  "ownerJid": "558...@s.whatsapp.net",
  "profileName": "Jota Wear",
  "profilePicUrl": "https://..."
}
```

## Normalisation rules
- `instanceName`: `item.name ?? item.instance?.instanceName ?? 'unknown'`
- `connectionStatus`: if string → use directly; if object → read `.state`
- `phone`: `item.number ?? item.phoneNumber ?? null`

**Why:** Evolution API v2.0+ flattened the response shape. v1.x had nested `instance` and `connectionStatus` objects. Adapter must handle both for backward compat.

**How to apply:** All code reading fetchInstances output must go through the resolve helpers in `useEvolution.ts`.
