# MPconnect API Reference

Base URL: `http://localhost:3000` (local) or your Vercel deployment URL.

All request bodies are JSON. Unknown fields are rejected (strict validation).

---

## Intake

### `POST /api/submissions`

Create a submission from any channel (web, Telegram, voice).

**Body:**
```json
{
  "channel": "web",
  "citizenKey": "demo-user-abc",
  "rawText": "optional original text",
  "mediaUrl": "optional",
  "audioUrl": "optional",
  "lang": "te",
  "extraction": {
    "kind": "grievance",
    "category": "drainage",
    "locationText": "Gajuwaka Main Road",
    "lat": 17.68,
    "lng": 83.21,
    "ward": "gajuwaka",
    "urgency": "high",
    "summaryEn": "Drainage blocked near bus stop",
    "summaryTe": "బస్ స్టాప్ దగ్గర డ్రైనేజీ",
    "confidence": 0.85
  }
}
```

**Response:** `{ refId, submissionId, status, flags? }`

- Rate cap (3/day per citizenKey): still accepted, `status: "quarantined"`, `flags.reason: "rate_cap"`
- Low confidence (<0.6): `status: "received"`, `flags.needs_human: true`

```bash
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{"channel":"web","citizenKey":"demo-1","extraction":{"kind":"grievance","category":"school_upgrade","ward":"gajuwaka","urgency":"medium","summaryEn":"Upgrade school","confidence":0.9}}'
```

### `GET /api/submissions/:refId`

Public status lookup by reference ID (e.g. `VZG-2607-00001`).

---

## Demands

### `GET /api/demands`

List all demands, ordered by `rankScore` descending.

### `GET /api/demands/:id`

Demand detail with event timeline and chain verification result.

### `GET /api/demands/:id/verify-chain`

Returns `{ ok: true }` or `{ ok: false, brokenAtEventId }`.

### `POST /api/demands/:id/validate`

Human promotes `claimed` → `validated_public`.

```json
{ "actorId": "official-1" }
```

### `POST /api/demands/:id/route-approve`

Human approves routing to a verified authority.

```json
{ "authorityId": 1, "actorId": "official-1", "proposedAuthorityId": 1 }
```

### `POST /api/demands/:id/fix-claim`

Official claims work is done; creates verification polls for up to 3 reporters.

```json
{ "actorId": "official-1", "evidenceUrl": "https://..." }
```

### `GET /api/demands/:id/evidence`

Evidence panel data (delegates to Person C's `evidence.ts` when available).

### `GET /api/demands/:id/mplads-pack`

MPLADS funding pack (delegates to Person C's `mplads.ts` when available).

---

## Verification

### `GET /api/verifications?citizenKey=demo-user-abc`

Pending verification polls for a citizen (used by chat UIs).

### `POST /api/verifications/:id/respond`

```json
{
  "response": "confirm",
  "citizenKey": "demo-user-abc",
  "photoUrl": "optional for deny"
}
```

- Any **deny** → demand reopens, `falseClosureCount` increments
- **2 of 3 confirms** (demo quorum) → `resolved_verified`

---

## Stats & Wards

### `GET /api/stats`

North-star metrics: verified rate, false closures, per-ward and per-authority breakdowns.

### `GET /api/wards`

Pilot ward polygons for the dashboard map.

---

## Review queues

### `POST /api/review/quarantine/:submissionId`

```json
{ "action": "release", "actorId": "reviewer-1" }
```

or `{ "action": "reject", "actorId": "reviewer-1", "reason": "..." }`

### `POST /api/review/merge/:submissionId`

Human merge-review decision (ambiguous band).

```json
{ "decision": "merge", "demandId": "uuid", "actorId": "reviewer-1" }
```

---

## Dev & Cron

### `POST /api/dev/simulate-attack`

Requires `ENABLE_DEV_ENDPOINTS=true`. Fires 15 templated cold-identity submissions.

### `GET /api/cron/verification-timeout`

Moves `fix_claimed` demands past 14 days to `resolved_unverified`.

---

## Integration hooks for other team members

| Person | Wire into | Function |
|--------|-----------|----------|
| B | Intake | `POST /api/submissions` after Gemini extraction |
| C | After intake | `src/lib/merge.ts` → `processSubmission()` via merge-hook |
| C | Evidence/MPLADS | `evidenceFor()`, `mpladsPack()` — routes already exposed |
| D | Dashboard | `GET /api/demands`, `/stats`, `/wards` |
| D | Review UI | `/api/review/*`, `/api/dev/simulate-attack` |
