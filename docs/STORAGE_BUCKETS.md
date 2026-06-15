# Storage Buckets – HR/HMS PWA

> **Versjon:** 1.0 – Juni 2026  
> Dokumenterer Supabase Storage-konfigurasjonen.  
> Alle buckets er **private**. Ingen offentlig tilgang er tillatt.

---

## Oversikt

| Bucket-navn | Synlighet | Brukes til | Signert URL |
|---|---|---|---|
| `incident-attachments` | Privat | Vedlegg til avviksmeldinger | Ja – 60 sek |
| `documents` | Privat | HMS- og HR-dokumenter | Ja – 60 sek |
| `contracts` | Privat | Arbeidskontrakter og signeringsvedlegg | Ja – 300 sek |

---

## Oppsett i Supabase

For hvert bucket:
1. Supabase → Storage → New Bucket
2. **Public bucket:** OFF (aldri aktivert)
3. **Allowed MIME types:** valgfritt (appen validerer på server-side)
4. **Max file size:** settes ikke på bucket-nivå (valideres i tRPC-router)

> ⚠️ Hvis en bucket ved uhell er satt til public=true, er alle filer offentlig tilgjengelige uten autentisering. Verifiser dette ved pilotstart.

---

## Tillatelser og tilgangskontroll

Tilgang til filer styres **utelukkende via server-side signerte URLer** generert av Supabase Admin Client (`SUPABASE_SERVICE_ROLE_KEY`). Ingen klient-side tilgang til buckets.

### `incident-attachments`

| Rolle | Lese | Laste opp | Slette |
|---|---|---|---|
| ADMIN | ✅ (signert URL) | ✅ | ✅ |
| HR | ✅ (signert URL) | ✅ | ✅ |
| MANAGER | ✅ (egne avvik + avd.) | ❌ (HR/ADMIN oppl.) | ❌ |
| EMPLOYEE | ✅ (egne avvik) | ✅ (egne avvik) | ❌ |

### `documents`

| Rolle | Lese | Laste opp | Slette |
|---|---|---|---|
| ADMIN | ✅ (signert URL) | ✅ | ✅ |
| HR | ✅ (signert URL) | ✅ | ✅ |
| MANAGER | ✅ (signert URL) | ❌ | ❌ |
| EMPLOYEE | ✅ (offentlige dok.) | ❌ | ❌ |

### `contracts`

| Rolle | Lese | Laste opp | Slette |
|---|---|---|---|
| ADMIN | ✅ (signert URL) | ✅ | ✅ |
| HR | ✅ (signert URL) | ✅ | ✅ |
| MANAGER | ✅ (egne ansatte) | ❌ | ❌ |
| EMPLOYEE | ✅ kun hvis `sharedWithEmployee=true` | ❌ | ❌ |

---

## Teknisk implementasjon

### Opplasting (server-side signert upload URL)

```typescript
// server/routers/contract.ts, attachment.ts, document.ts
const { data } = await supabase.storage
  .from(CONTRACT_BUCKET)
  .createSignedUploadUrl(fileKey);
// → signedUrl returneres til klient; klient laster opp direkte til Supabase
```

### Nedlasting (server-side signert download URL)

```typescript
const { data } = await supabase.storage
  .from(CONTRACT_BUCKET)
  .createSignedUrl(fileKey, 300); // utløper etter 300 sekunder
// → signedUrl returneres til klient
```

Filnøkler (`fileKey`) er lagret i databasen per entitet:
- `Attachment.fileKey` — vedlegg til avvik
- `Document.fileKey` — HMS/HR-dokumenter
- `Contract.fileKey` — kontrakter

---

## Filvalidering

Validering skjer i tRPC-routere (server-side) — **ikke kun klient-side**:

```typescript
// lib/supabase/admin.ts
export const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
```

---

## Rate limiting

Upload-endepunkter er rate-limited per bruker:

| Endepunkt | Limit | Vindu |
|---|---|---|
| `attachment.getUploadUrl` | 30 req | 1 minutt |
| `document.getUploadUrl` | 30 req | 1 minutt |
| `contract.getUploadUrl` | 30 req | 1 minutt |

---

## Verifisering

```bash
# Test at direkte URL uten token gir 403
curl -I "https://<supabase-url>/storage/v1/object/contracts/<filnøkkel>"
# → Forventer: HTTP/1.1 400 eller 403

# Test at signert URL fungerer (kjøres fra appen)
# → Åpner fil i nettleser
# → Etter 300 sek (kontrakter) / 60 sek (andre): gir 400 Expired
```

---

*Sist oppdatert: 2026-06-15*
