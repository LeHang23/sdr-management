# SDR device simulator

This process behaves like remote SDR devices. It sends authenticated HTTP
heartbeats and telemetry to the backend and never opens the SQLite database.

## Run locally

Open two PowerShell terminals from the repository root and use the same private
development token in both processes.

Backend:

```powershell
$env:SDR_GATEWAY_TOKEN="local-simulator-token"
npm.cmd start
```

Simulator:

```powershell
$env:SDR_GATEWAY_TOKEN="local-simulator-token"
npm.cmd run simulator
```

Then open the independent Simulator Console at
[http://127.0.0.1:4180/](http://127.0.0.1:4180/). The console reads state from
the simulator process itself, not from the application database. It shows the
last heartbeat payload, the backend HTTP response, missed heartbeats, and the
current mode of every virtual device. Use it beside the Admin Dashboard to
verify that Overview reflects what the simulator actually sent.
Status refreshes update existing device cards in place, preserving open payload
sections, payload scroll positions, and active simulation-mode controls.

From the console you can pause or reset the simulator and force a device into
`online`, `warning`, `updating`, or `disconnected` mode. The `auto` mode keeps
the original rotating scenarios, including an intermittent disconnect for one
device.

The simulator creates four devices by default and sends one heartbeat per
device every 60 seconds. The backend marks a gateway device stale after three
missed default intervals (180 seconds). Override the simulator target and behavior
with `SDR_SERVER_URL`, `SDR_SIMULATOR_DEVICE_COUNT`, and
`SDR_SIMULATOR_INTERVAL_MS`. Override the local console binding with
`SDR_SIMULATOR_CONTROL_HOST` and `SDR_SIMULATOR_CONTROL_PORT`. Keep the console
bound to `127.0.0.1` unless access is protected by a trusted network or VPN.
Use `npm.cmd run simulator:once` for one heartbeat per device; one-shot mode
does not start the console.

To run the simulator from another computer, copy the repository, set `SDR_SERVER_URL` to the backend's reachable HTTP address,
and use the same gateway token. Use a VPN or HTTPS before sending a token over
an untrusted network.

## Reliability and configuration

| Variable | Default | Valid values |
| --- | --- | --- |
| `SDR_SIMULATOR_DEVICE_COUNT` | `4` | Integer 1–100; invalid values fail startup rather than being clamped |
| `SDR_SIMULATOR_INTERVAL_MS` | `60000` | Integer 250–715827882 ms |
| `SDR_SIMULATOR_REQUEST_TIMEOUT_MS` | `10000` | Integer 1–2147483647 ms; covers headers and the entire response body |
| `SDR_SIMULATOR_CONTROL_PORT` | `4180` | Integer 1–65535 |
| `SDR_HEARTBEAT_TIMEOUT_MS` (backend) | `180000` | Integer 1–2147483647 ms |

`SDR_SERVER_URL` must be an HTTP(S) URL without embedded credentials, query or
fragment. `SDR_GATEWAY_TOKEN` must be nonempty. Keep tokens outside the browser.

A failed or timed-out request appears as a transport error in the Console. The
continuous process retries on the next scheduled batch and clears the error
when a heartbeat succeeds. `simulator:once` exits with code 1 if any heartbeat
fails (including connection refusal, HTTP rejection or timeout), and code 0 if
all heartbeats are accepted. Invalid configuration also exits with code 1.

Batches run on a start-to-start cadence without overlapping. A batch that exceeds
its interval skips elapsed slots instead of sending a burst. Choose a request
timeout shorter than the heartbeat interval for the usual three-missed-heartbeat
scenario. The Console shows the actual next batch time/countdown and the
recommended backend timeout; it does not read or confirm backend Offline state.
`Not sending` and `Transport error` describe simulator transport, not backend
connectivity. Health badges describe the last intended payload.

The backend timeout remains a server-side policy. When changing the interval,
configure `SDR_HEARTBEAT_TIMEOUT_MS = 3 * SDR_SIMULATOR_INTERVAL_MS` on the backend
separately. For example, with a 5-second interval:

Backend PowerShell:

```powershell
$env:SDR_HEARTBEAT_TIMEOUT_MS = '15000'
$env:SDR_GATEWAY_TOKEN = 'local-simulator-token'
npm.cmd start
```

Simulator PowerShell:

```powershell
$env:SDR_SIMULATOR_INTERVAL_MS = '5000'
$env:SDR_SIMULATOR_REQUEST_TIMEOUT_MS = '2000'
$env:SDR_GATEWAY_TOKEN = 'local-simulator-token'
npm.cmd run simulator
```

Expiration is measured from the last accepted heartbeat and applied by the
backend sweep (up to five seconds later). A shared fleet timeout cannot represent
three missed heartbeats for clients with different intervals; configure the fleet
consistently or choose an explicit server policy.

## Control semantics

- Pause stops future batches and cancels pending HTTP waits. Resume sends a new
  batch promptly; repeating Resume while running leaves the schedule unchanged.
- Reset clears simulator counters/history, restores `auto` modes, cancels pending
  waits and starts a fresh batch. It does not clear backend devices or telemetry.
- Changing mode cancels that device's pending wait; the new mode is used on the
  next scheduled batch. Other devices continue. `disconnected` intentionally
  skips heartbeats until another mode is selected.
- Cancelled results never overwrite reset state or count as accepted/failed.
  Cancellation cannot undo a heartbeat already received by the backend; its
  acceptance is unknown locally. Pause/mode changes preserve prior history.
- SIGINT/SIGTERM cancels pending waits and closes the Console without waiting
  for a long heartbeat interval.

Run `npm.cmd test` (or `npm test`) for HTTP, CLI exit-code, configuration and
Console-control regression coverage. Tests use temporary local servers and an
isolated database; they do not require real SDR hardware.

## Protected combined preview

`npm run start:hosted` runs the Dashboard at `/` and the Console at `/simulator/`
through one port. See
[`docs/deployment/SELF-HOSTED-PREVIEW.md`](../../docs/deployment/SELF-HOSTED-PREVIEW.md).
The machine and VM must stay running. Remote HTTPS access will be configured
separately after the Linux VM is ready.

`SDR_PREVIEW_PASSWORD` is mandatory in combined mode; `SDR_PREVIEW_USER` defaults
to `admin`. All Dashboard/Console reads and controls require authentication.
The health check contains no device data and remains public. The gateway uses
its own token, which is never sent to the browser.

For a standalone Console, set `SDR_SIMULATOR_CONSOLE_PASSWORD` (at least 12
nonblank characters) and optionally `SDR_SIMULATOR_CONSOLE_USER`. For remote
preview, use HTTPS. `SDR_DASHBOARD_PUBLIC_URL` controls the browser's Dashboard
link independently of `SDR_SERVER_URL`, the simulator's heartbeat destination.
Without a public URL, the combined runner uses its local address; heartbeat
traffic stays on loopback. Console API paths work at both `/` and `/simulator/`.
