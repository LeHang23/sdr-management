# SDR Management backend standards

Read this reference before changing the database schema, Overview summary, or
future SDR Gateway ingestion.

## Runtime baseline

- Node.js ESM with built-in `node:http` and `node:sqlite`.
- SQLite database path: `backend/data/sdr-management.db` by default. Override
  with `SDR_DATABASE_PATH` only for tests or an explicitly chosen environment.
- Start the application with `npm.cmd start`. It serves the static frontend and
  API on the same origin.

## Durable data model

| Table | Purpose | Future writer |
| --- | --- | --- |
| `devices` | Device identity, connection and health state | Manual entry or SDR Gateway |
| `device_issues` | Active/resolved device findings | Manual entry or SDR Gateway |
| `reconfiguration_jobs` | Reconfiguration lifecycle | Manual entry or job service |
| `overview_metadata` | Revision used to identify a coherent snapshot | Database triggers |

`source` is `manual` for locally entered simulator data and `sdr_gateway` for
physical SDR-derived records.

For manual simulator entry, use `backend/database/manual-entry.sql` as a
copy/paste template in a SQLite editor. The tracked seed is idempotent and is
only a starting dataset; runtime database files remain untracked.

## Status vocabulary

| Field | Accepted values |
| --- | --- |
| `devices.connection_status` | `online`, `offline` |
| `devices.health_status` | `online`, `warning`, `offline`, `updating` |
| `device_issues.severity` | `info`, `warning`, `critical` |
| `device_issues.status` | `active`, `resolved` |
| `reconfiguration_jobs.status` | `queued`, `deploying`, `verifying`, `retrying`, `succeeded`, `failed`, `cancelled` |

`queued`, `deploying`, `verifying`, and `retrying` are active jobs. The other
job states are terminal.

## Overview API contract

`GET /api/v1/overview/summary` returns one snapshot:

```json
{
  "snapshotId": "overview-42",
  "generatedAt": "2026-08-29T12:03:45.000Z",
  "source": { "mode": "manual", "label": "Manual database input" },
  "metrics": {
    "totalDevices": 24,
    "onlineNow": 19,
    "needsAttention": 5,
    "activeJobs": 3
  }
}
```

The service reads all counts in one transaction. `Needs attention` is a unique
device count: Warning or Offline devices plus any device with an active critical
issue, without double counting. A zero count is valid only when the relevant
table/query is available and empty.

## SDR Gateway handoff

When physical SDR data exists, add an ingestion adapter that validates external
telemetry, maps it to the status vocabulary above, and upserts it in a single
transaction. Do not change the Overview API or make the frontend understand the
SDR protocol. Preserve original device identifiers in `devices.id` and update
`last_seen_at` on each accepted telemetry record.
