# RS-03 - Status and schedule

| Field | Value |
| --- | --- |
| Screen | SDR Simulator Console |
| FBS | FBS-3.1 |
| Priority | Must |

## Goal

Let testers inspect actual simulator transport and timing without mistaking them for backend connectivity.

## Requirements

| ID | Requirement |
| --- | --- |
| RS-SIM-STATUS-01 | Display transport status, last intended health, payload/response, errors, acceptance time and counters without exposing the gateway token. |
| RS-SIM-STATUS-02 | Skipped/failed transport shall not be labelled backend-confirmed Offline. The Console shall state that it does not read backend Offline status. |
| RS-SIM-STATUS-03 | Display the actual next batch time/countdown, or Sending/Paused, with interval, request timeout and the recommended backend timeout. |
| RS-SIM-STATUS-04 | Refresh device cards in place and preserve open payload details, scroll and active mode selection. |

## States and edge cases

- See screen states in SRS.md; keep errors and history inspectable.

## Acceptance criteria

- Console reflects the process schedule and controls without inventing backend connectivity; failed transport uses a text label as well as color.
