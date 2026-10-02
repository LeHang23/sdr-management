# Protected combined preview

The shared preview runtime serves the Dashboard at `/` and Simulator Console at
`/simulator/` through one port. It can run on a Linux VM, with backend and
simulator communicating over internal HTTP. The host machine and VM must stay on.

On 2 October 2026 the operator confirmed Ubuntu Desktop in VMware on Windows,
an active `sdr-preview` user service with accepted heartbeats, and access from
another device through Tailscale. This is private tailnet HTTPS, not a public
deployment. Reboot recovery and control actions over HTTPS still need operator
verification; the actual HTTPS origin has not been recorded here.

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
| `SDR_SIMULATOR_STATE_PATH` | Simulator configuration/receipts JSON, default `backend/data/simulator-state.json` in combined mode |

All data and control routes require authentication. Only a minimal `/health`
response is public. Gateway ingestion has separate Bearer authentication, and
cross-site browser control submissions are rejected.

When remote access is configured, serve it over HTTPS and set
`SDR_DASHBOARD_PUBLIC_URL` to the actual origin. Simulator heartbeat traffic
stays on loopback. `/simulator/` requests resolve under that prefix.

Host shutdown/sleep stops the preview. Preserve and back up the configured
SQLite location and simulator JSON if demo history matters. Counters/history
reset on restart; device configuration, modes and applied-command receipts persist.
The original `npm start` and standalone `npm run simulator`
commands remain available for normal local development.

## Ubuntu user service

Install Git, curl, OpenSSH and VMware desktop tools, then install Node.js 24
with nvm. Use your Ubuntu account, not root, for the application. Clone
`device-simulator` or update a clean checkout with `git pull --ff-only`.

Inside the actual repository run `pwd -P` and verify
`ls package.json backend/scripts/hosted-preview.js`. Use that absolute path
in **both** the script `cd` and service `WorkingDirectory` below. Running
`systemctl`, `curl`, `journalctl` or `nano` does not require standing in the repo.

```bash
mkdir -p ~/.config/sdr-preview ~/.config/systemd/user ~/.local/bin
chmod 700 ~/.config/sdr-preview
nano ~/.config/sdr-preview/runtime.env
```

Keep the same web password used for the manual run. Put it only in this local
file, replacing the placeholder (at least 12 nonblank characters):

```text
SDR_PREVIEW_USER=admin
SDR_PREVIEW_PASSWORD="YOUR_EXISTING_WEB_PASSWORD"
HOST=127.0.0.1
PORT=4173
```

Within the quoted password escape a double quote as `\"` and a backslash as
`\\`. Save, then `chmod 600 ~/.config/sdr-preview/runtime.env`.
Create `~/.local/bin/sdr-preview`:

```bash
#!/usr/bin/env bash
set -e
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 24 >/dev/null
cd "/ABSOLUTE/REPOSITORY/PATH"
exec node backend/scripts/hosted-preview.js
```

Create `~/.config/systemd/user/sdr-preview.service`:

```ini
[Unit]
Description=SDR Dashboard and Simulator Preview

[Service]
Type=simple
WorkingDirectory=/ABSOLUTE/REPOSITORY/PATH
EnvironmentFile=%h/.config/sdr-preview/runtime.env
ExecStart=/bin/bash %h/.local/bin/sdr-preview
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Replace both repository placeholders before running. `%h` already means
`/home/<username>`; do not append the username a second time. `200/CHDIR` means
the service working directory is wrong. A script error naming its `cd` line
means the script path is wrong, even if the service working directory is correct.

Stop any manual hosted process with Ctrl+C to free port 4173, then:

```bash
chmod 700 ~/.local/bin/sdr-preview
systemctl --user daemon-reload
systemctl --user enable --now sdr-preview.service
sudo loginctl enable-linger "$(whoami)"
systemctl --user status sdr-preview.service --no-pager
curl http://127.0.0.1:4173/health
```

Expect sustained `active (running)` and `{"status":"ok"}`. A successful health
response alone might belong to an old manual process. Diagnose failures with
`journalctl --user -u sdr-preview.service -n 40 --no-pager`.
After editing configuration run `systemctl --user restart sdr-preview.service`.
Verify after rebooting Ubuntu. VMware startup after rebooting Windows is a
separate host setting; the service cannot turn on the VM. Disable automatic
suspend on Ubuntu and sleep on Windows while the preview must be available.

## Private HTTPS through Tailscale Serve

Install Tailscale in Ubuntu following <https://tailscale.com/download/linux>,
then authorize the VM and configure Serve:

```bash
sudo tailscale up
sudo tailscale serve --bg http://127.0.0.1:4173
sudo tailscale serve status
```

Use the actual HTTPS origin shown by Serve, enable tailnet HTTPS if prompted,
and add `SDR_DASHBOARD_PUBLIC_URL=https://YOUR-ACTUAL-HOST.ts.net` to the local
environment file. Restart the user service. The Dashboard is at `/` and Console
at `/simulator/`. Client devices must be connected to Tailscale and authorized
for this tailnet. Serve does not move the server off the VM.

Verify login, heartbeat, pause/resume and the Dashboard link from another network,
then repeat after reboot. Do not publish passwords, tokens or authentication links.
Cloudflare Tunnel with a managed domain remains an alternative if a public URL
is needed; it is not the confirmed deployment here.

## Updating the running VM

After reviewing the branch changes, from your repository (with a clean working
tree and no divergent local commits):

```bash
git switch device-simulator
git pull --ff-only origin device-simulator
systemctl --user restart sdr-preview.service
systemctl --user status sdr-preview.service --no-pager
```

Existing web credentials and Tailscale configuration stay in the VM. The new
inventory defaults to the configured device count only if there is no saved JSON.
Back up SQLite and JSON while the service is stopped; do not reset or overwrite
these files to update application code. See the Simulator README for new controls.
