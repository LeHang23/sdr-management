# Protected combined preview

The shared preview runtime serves the Dashboard at `/` and Simulator Console at
`/simulator/` through one port. It can run on a Linux VM, with backend and
simulator communicating over internal HTTP. The host machine and VM must stay on.

Render configuration and deployment links have been removed. Linux VM setup,
automatic startup and remote HTTPS access are pending; there is no live public
URL yet.

## Shared runtime

With Node.js 22.5 or newer, run from the repository root:

```bash
export SDR_PREVIEW_USER=admin
read -r -s -p 'Preview password (at least 12 characters): ' SDR_PREVIEW_PASSWORD
echo
export SDR_PREVIEW_PASSWORD
npm run start:hosted
```

Open `http://127.0.0.1:4173/` and `http://127.0.0.1:4173/simulator/`. Both pages
use the same credentials. Stop with Ctrl+C. Passwords and gateway tokens must
remain outside Git, public URLs and Notion.

The runner requires a strong preview password, starts a backend on loopback,
starts the simulator and Console, and exposes one proxy port. It uses
`backend/data/hosted-preview.db`, separate from the normal development DB.

## Configuration retained for later setup

| Setting | Purpose |
| --- | --- |
| `HOST` / `PORT` | Proxy bind address and port; defaults are `127.0.0.1:4173` |
| `SDR_PREVIEW_USER` / `SDR_PREVIEW_PASSWORD` | Shared Dashboard/Console login |
| `SDR_DASHBOARD_PUBLIC_URL` | Actual HTTPS origin for browser navigation, once configured |
| `SDR_DATABASE_PATH` | Optional SQLite location on the VM |
| `SDR_GATEWAY_TOKEN` | Optional server-side token; otherwise generated per run |
| `SDR_SIMULATOR_INTERVAL_MS` | Heartbeat interval, default 5000 ms |
| `SDR_SIMULATOR_REQUEST_TIMEOUT_MS` | Request deadline, default 2000 ms |

All data and control routes require authentication. Only a minimal `/health`
response is public. Gateway ingestion has separate Bearer authentication, and
cross-site browser control submissions are rejected.

When remote access is configured, serve it over HTTPS and set
`SDR_DASHBOARD_PUBLIC_URL` to the actual origin. Simulator heartbeat traffic
stays on loopback. `/simulator/` requests resolve under that prefix.

Host shutdown/sleep stops the preview. Preserve and back up the configured
SQLite location if demo history matters. Simulator counters and modes reset on
process restart. The original `npm start` and standalone `npm run simulator`
commands remain available for normal local development.
