# RS-04 - Protected remote preview

| Field | Value |
| --- | --- |
| Screen | SDR Simulator Console |
| FBS | FBS-3.1 |
| Priority | Must |

## Goal

View and control the demo from another device through the running host/VM.

## Requirements

| ID | Requirement |
| --- | --- |
| RS-SIM-REMOTE-01 | Require preview authentication for hosted Dashboard and all Console pages/APIs; fail startup without a strong password. |
| RS-SIM-REMOTE-02 | Use the same preview credentials for both interfaces while keeping the gateway token separate and server-side. |
| RS-SIM-REMOTE-03 | Reject cross-site browser requests that change simulator controls. |
| RS-SIM-REMOTE-04 | Support the Console at /simulator/ and standalone /; controls and polling shall resolve under the active prefix. |
| RS-SIM-REMOTE-05 | The Dashboard navigation link shall use the public hosting URL independently of the internal heartbeat destination. |
| RS-SIM-REMOTE-06 | Serve only a minimal health response without preview credentials; protect device data behind authentication. |
| RS-SIM-REMOTE-07 | Hosted startup shall run backend and simulator together in the selected runtime; the host/VM must remain running and shutdown shall close both. |
| RS-SIM-REMOTE-08 | Document host/VM uptime and demo database storage requirements; do not promise continuous simulation when the host is off. |

## States and edge cases

- Missing/wrong credentials return 401; invalid hosted passwords prevent startup.
- Stopping the host/VM stops the demo. Database retention depends on the configured storage and backup.

## Acceptance criteria

- Verify both pages/APIs on one port, authentication, mode/control and the public Dashboard URL.
- Complete actual HTTPS verification only after a successful deployment.
