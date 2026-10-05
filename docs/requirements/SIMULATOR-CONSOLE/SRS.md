# Software Requirements Specification - SDR Simulator Console

## 1. Screen information

| Field | Value |
| --- | --- |
| Screen | SDR Simulator Console |
| Role | Developer / tester |
| Design status | Implemented simulation; physical integration planned |
| Figma frame | Not available |
| FBS reference | FBS-3.1 |

## 2. Purpose

Inspect and control a remote HTTP-based simulator independently of the application DB.

## 3. Preconditions

- Valid configuration and gateway token; a reachable backend is required for acceptance, but transport failure must not stop continuous mode.

## 4. Screen requirements

| ID | Requirement | Related RS |
| --- | --- | --- |
| SRS-SIM-01 | Heartbeat reliability | RS-01-HEARTBEAT-RELIABILITY.md |
| SRS-SIM-02 | Process controls | RS-02-PROCESS-CONTROLS.md |
| SRS-SIM-03 | Status and schedule | RS-03-STATUS-AND-SCHEDULE.md |
| SRS-SIM-04 | Protected remote preview access | RS-04-REMOTE-PREVIEW.md |
| SRS-SIM-05 | Inventory | RS-05-DEVICE-INVENTORY.md |
| SRS-SIM-06 | Telemetry and transport scenarios | RS-06-TELEMETRY-SCENARIOS.md |
| SRS-SIM-07 | Simulated reconfiguration | RS-07-SIMULATED-RECONFIGURATION.md |

## 5. Screen states

| State | Expected behavior |
| --- | --- |
| Loading | Connecting until first status response |
| Ready | Show device cards and process schedule |
| Paused | No future batch; pending waits cancelled |
| Error | Show transport/control failure and retain inspectable history |
| Disconnected scenario | Skip sends; do not claim confirmed backend Offline |
| Preview unauthorized | Browser requests credentials; APIs return 401 |
| Backend rejects token | Report HTTP rejection without exposing credentials |

## 6. Data and interaction

- Console polls simulator status each second; controls use HTTP APIs under the served prefix. No direct DB access.
- Reset clears counters/scenarios, retains inventory and command receipts; mode changes apply to the next batch. Backend status polling continues while paused. Command execution pauses with the simulator.

## 7. Non-functional screen requirements

- Use English UI copy, semantic controls, visible focus and text status labels.
- Keep tokens in the process and preserve card details across refresh.

## 8. Acceptance summary

- HTTP timeout, one-shot exit codes, control races and backend recovery have regression coverage.
- The displayed schedule matches process state and never infers backend Offline.
- Backend-confirmed status, persisted inventory/scenarios and simulated job outcomes are implemented and regression-tested. Physical SDR integration remains planned.

- Hosted preview requires authentication; verify the actual HTTPS URL after configuring remote access on the running Linux VM.
