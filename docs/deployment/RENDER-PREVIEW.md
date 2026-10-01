# Protected Render demo

Deploy one free Render web service that serves both the Admin Dashboard and the
Simulator Console. Your personal computer does not need to remain on.

[Deploy to Render](https://render.com/deploy?repo=https://github.com/LeHang23/sdr-management/tree/device-simulator)

The button selects the current `device-simulator` branch. No deployment or live
URL exists until you create the service in your Render account.

## Create the service

1. Open the Deploy to Render link, sign in or create a Render account, and connect
   GitHub if asked. Grant access to `LeHang23/sdr-management`.
2. Review the Blueprint: one `sdr-management` web service, **Free** plan,
   `npm run start:hosted`, and health check `/health`. Confirm the branch is
   `device-simulator`, then create the service.
3. Wait for the service to show **Live**. Copy its actual HTTPS URL from Render.
   Do not assume that its hostname is exactly `sdr-management.onrender.com`.
4. In the service's **Environment** settings, view `SDR_PREVIEW_PASSWORD`.
   Render generates this password automatically. Username: `admin`.
5. Open the Dashboard at the service URL, and the Console at that URL followed
   by `/simulator/`. Use the same preview credentials for both pages.

For example, if Render gives you `https://your-service.onrender.com`:

| Page | URL |
| --- | --- |
| Dashboard | `https://your-service.onrender.com/` |
| Simulator Console | `https://your-service.onrender.com/simulator/` |

These are examples, not active deployment links. The Console's **Open Admin
Dashboard** link automatically uses Render's `RENDER_EXTERNAL_URL`; there is no
localhost link to edit after deployment. Do not paste passwords or gateway tokens
into Notion, Git commits, screenshots or URLs.

## How the preview runs

`npm run start:hosted` starts an authenticated Dashboard backend on an internal
loopback port, an independent HTTP-based simulator and its authenticated Console,
and a public HTTP proxy on Render's assigned `PORT`. The simulator sends
heartbeats internally and never opens the Dashboard database.

The public proxy serves the Dashboard under `/`, the Console under `/simulator/`,
and a minimal unauthenticated `/health` endpoint for Render checks. Gateway
heartbeat ingestion retains its separate Bearer authentication. All other
Dashboard/Console routes require Basic authentication; Render supplies HTTPS.
Cross-site browser control submissions are rejected.

The default hosted interval is five seconds, with a two-second request timeout
and a 15-second backend Offline timeout. No static seed fleet is added. Accepted
simulator heartbeats create the demo devices and telemetry. A stop/restart resets
simulator state; do not expect a persistent scenario configuration.

## Free-plan limits

Free services can sleep after inactivity. Opening a page wakes the service and
can take a while. The simulator pauses while the service sleeps and resumes
with the service; this is not a continuously running 24/7 fleet.

SQLite is demo storage on an ephemeral filesystem. Restart/redeploy/sleep can
lose history. Use persistent storage or a managed database if durable records
become required. Check Render's current account limits and pricing during setup;
keep the Blueprint on **Free** unless you deliberately choose a paid plan.

## Check the deployment

- Both page URLs request credentials; unauthenticated APIs return 401.
- The Console shows accepted heartbeats and the Dashboard shows the same fleet.
- Pause/resume/reset and mode changes work under `/simulator/`.
- **Open Admin Dashboard** resolves to the hosted URL.
- `/health` returns 200 without revealing data or secrets.

Share the actual service URL after deployment so it can be recorded in Notion.
Keep the deployment-verification task unchecked until these checks pass online.

## Local hosted-mode check

```powershell
$env:SDR_PREVIEW_PASSWORD = 'choose-a-private-password-at-least-12-characters'
npm.cmd run start:hosted
```

Open `http://127.0.0.1:4173/` and `http://127.0.0.1:4173/simulator/`. This local
mode uses `backend/data/hosted-preview.db`, separate from the normal development
DB. Stop with Ctrl+C. The original `npm start` and standalone `npm run simulator`
workflows remain available for local development.
