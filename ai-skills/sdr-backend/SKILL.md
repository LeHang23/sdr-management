---
name: sdr-backend
description: Build, change, and verify the Node.js backend for SDR Management, including manual SQLite data, stable API contracts, and future SDR Gateway ingestion. Use for backend APIs, database schema, simulator/manual-data workflows, and backend review; do not use for Figma-only or CSS-only work.
metadata:
  short-description: Build SDR Management Node.js backend
---

# SDR backend workflow

Use this skill for the backend of SDR Management. The product currently accepts
manual SQLite data as its simulator source, while future SDR Gateway ingestion
must write into the same durable model and preserve API contracts.

## Project invariants

- Backend code belongs in `backend/`; frontend code belongs in `frontend/`.
- Use Node.js built-ins first. The baseline uses `node:sqlite` and the native
  HTTP server; do not add a framework or package unless the requested behavior
  needs one and the user authorizes it.
- The local SQLite file under `backend/data/` is runtime data and must remain
  ignored by Git. Track schema, seed, and migration code instead.
- Keep `devices`, `device_issues`, and `reconfiguration_jobs` as the shared
  source of truth. Manual input and future SDR Gateway adapters must write to
  those tables rather than inventing a parallel summary store.
- API responses must identify the data source as `manual` or `sdr_gateway` so
  the UI does not present demo data as physical SDR telemetry.

## Before changing backend behavior

1. Read the user request and the English requirements in the relevant screen
   folder. For Overview work, read `OVERVIEW/SRS.md`, its `RS-*.md` files, and
   `docs/requirements/FBS.md`.
2. Read [backend standards](references/backend-standards.md) before changing
   the SQLite schema, summary calculations, status vocabulary, or API shape.
3. Inspect existing backend modules and tests before adding files or changing
   a query.

## Implementation rules

- Create idempotent migrations and seed data; a seed command must not overwrite
  a person's manually entered rows.
- Derive dashboard metrics inside one read transaction so all values represent
  the same snapshot. Never independently fetch or cache four KPI values.
- Treat an empty fleet as valid zero data. Treat a malformed or missing source
  value as unavailable, not zero.
- `Needs attention` counts each device once when it is Warning, Offline, or has
  an active critical issue. `Active jobs` are non-terminal jobs; use the status
  vocabulary in the backend standards reference.
- When adding an SDR connector later, isolate protocol mapping in an adapter or
  ingestion module. Its output should upsert the durable model in one write
  transaction and mark rows with `source = 'sdr_gateway'`.
- Do not expose speculative unauthenticated write APIs merely to make manual
  entry easier. Until access control is implemented, manual input is through
  the local database or controlled scripts.

## Simulator reliability

- Keep CLI configuration in `backend/simulator/simulator-config.js` and isolate
  instance state in `simulator-runtime.js`; imports must not start a process.
- Bound heartbeat requests through response-body consumption. Continuous mode
  recovers on its next batch; one-shot mode exits nonzero on any failed send.
- Validate integer settings at startup, without silently clamping device count.
- Preserve start-to-start cadence, skip elapsed slots and prevent overlapping batches.
- Pause/reset/mode changes cancel obsolete attempts; late results must not mutate
  the current generation. Cancellation cannot undo backend ingestion.
- Console transport failure or skipped sends do not establish backend Offline.
- Keep backend Offline timeout explicit and document three times the simulator
  interval plus sweep latency. Do not silently change server policy from clients.
- Cover HTTP headers/body timeouts, exit codes, recovery and in-flight controls
  in `backend/test/device-simulator.test.js`.

## Hosted demo

- `backend/scripts/hosted-preview.js` owns the Render process lifecycle and one
  public port. Keep Dashboard and simulator state separate and use HTTP ingestion.
- Require `SDR_PREVIEW_PASSWORD` before binding hosted endpoints. Protect all
  data and controls; leave only a minimal health response public. Preserve
  gateway Bearer authentication and reject cross-site browser control writes.
- Keep public navigation URLs separate from internal heartbeat URLs. Console
  requests must resolve under its `/simulator/` prefix as well as standalone `/`.
- Generate deployment secrets through Render environment settings, never source.
- Document free-service sleep and ephemeral SQLite; do not claim 24/7 uptime.
- Actual HTTPS deployment checks require a created Render service; do not mark
  those tasks complete based only on local tests.

## Verification

Run the relevant commands after changes:

```powershell
npm.cmd run test
npm.cmd run db:init
npm.cmd run db:seed
powershell -ExecutionPolicy Bypass -File ai-skills/sdr-backend/scripts/validate_backend.ps1
```

For API changes, start the server and verify the intended endpoint returns a
consistent snapshot, correct empty values, and a source label. Do not claim a
real SDR integration works until a gateway or physical-device adapter exists.

## Boundaries

- Do not commit generated `.db`, WAL, or shared-memory files.
- Do not replace manual data with random telemetry or claim it is live.
- Do not change requirements just to fit the implementation; use the
  requirements workflow if the product rule itself needs clarification.
