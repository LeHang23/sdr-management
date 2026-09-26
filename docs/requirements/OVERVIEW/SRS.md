# Software Requirements Specification - Overview

## 1. Screen information

| Field | Value |
| --- | --- |
| Screen | Overview |
| Parent shell | Admin Dashboard |
| Role | Administrator |
| Design status | Designed |
| Figma frame | Dashboard, Overview content region, 1440 x 1024 |
| FBS reference | FBS-1.1 through FBS-1.1.6 |

## 2. Purpose

The Overview page gives Administrators an immediate view of fleet condition,
performance, active work, and recent incidents. It also provides focused entry
points for device investigation and remote reconfiguration.

## 3. Preconditions

- The Admin Dashboard shell has loaded successfully.
- Overview is the active navigation destination.
- Demo data is provided by the SDR Simulator until physical devices are
  integrated.
- A remote simulator shall use the authenticated Device Gateway contract rather
  than writing directly to the application database.

## 4. Screen requirements

| ID | Requirement | Related RS |
| --- | --- | --- |
| SRS-OVW-01 | The page shall display Total devices, Online now, Needs attention, and Active jobs summary metrics. | RS-01-FLEET-SUMMARY.md |
| SRS-OVW-02 | The page shall display Throughput and SNR trends for a selected time range. | RS-02-SYSTEM-PERFORMANCE.md |
| SRS-OVW-03 | The page shall display the device health distribution for Healthy, Warning, Offline, and Updating states, distinct from the Online now connectivity metric. | RS-03-FLEET-HEALTH.md |
| SRS-OVW-04 | The page shall display a prioritized list of devices requiring investigation and provide `View all` access to the complete filtered list when Device Management is available. | RS-04-DEVICES-TO-WATCH.md |
| SRS-OVW-05 | The page shall display recent alerts from newest to oldest and provide an `All` action for access to the complete Alert inbox when available. | RS-05-RECENT-ALERTS.md |
| SRS-OVW-06 | The page shall provide a primary action for starting a reconfiguration workflow. | RS-06-NEW-RECONFIGURATION.md |

## 5. Screen states

| State | Expected behavior |
| --- | --- |
| Loading | Display stable placeholders for cards, charts, and lists without layout shift. |
| Ready | Display the latest successful Overview snapshot and live updates. |
| Empty | Show zero-value summaries and clear empty-state guidance instead of blank panels. |
| Partially unavailable | Preserve available panels and show an inline error with retry for failed data sources. |
| Offline | Keep the last successful snapshot visible and mark its data as stale. |
| Unauthorized | Prevent Overview data from rendering and defer to the Admin Dashboard access-control flow. |

## 6. Data refresh and interaction

- Current device state should be reflected within five seconds of ingestion
  while the platform is connected.
- A simulator heartbeat shall identify its data as simulated, and an expired
  heartbeat shall cause the corresponding remote simulated device to become
  Offline.
- The default simulator heartbeat interval shall be 60 seconds. The default
  stale-device timeout shall be 180 seconds so a device is not marked Offline
  until it misses three expected heartbeats.
- Changing a chart time range shall not reload the entire page.
- Selecting a device, alert, `View all`, `All`, or primary action shall open the
  corresponding target screen or workflow when available.
- Status information shall use text or icons in addition to color.

## 7. Non-functional screen requirements

- Primary Overview content shall render within two seconds under the demo
  workload on a typical broadband connection.
- The page shall remain usable inside the Admin Dashboard shell from a 1024px
  viewport width, with 1440px as the primary design target.
- Core controls shall be keyboard accessible and expose accessible names.
- The page shall use English interface copy and support future localization.

## 8. Acceptance summary

- An Administrator can understand fleet condition without opening another page.
- Offline or stale data is clearly distinguishable from current data.
- Every Overview UI group traces to a numbered RS feature file in this folder.
