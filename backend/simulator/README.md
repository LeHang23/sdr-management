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

To run the simulator from another computer, copy the repository (or this
simulator module), set `SDR_SERVER_URL` to the backend's reachable HTTP address,
and use the same gateway token. Use a VPN or HTTPS before sending a token over
an untrusted network.
