# RS-01 - Heartbeat reliability

| Field | Value |
| --- | --- |
| Screen | SDR Simulator Console |
| FBS | FBS-3.1 |
| Priority | Must |

## Goal

Provide dependable heartbeat delivery and an unambiguous result for automated runs.

## Requirements

| ID | Requirement |
| --- | --- |
| RS-SIM-NET-01 | Bound every heartbeat request, including response-body reading, by a configurable deadline. |
| RS-SIM-NET-02 | Continuous mode shall continue after HTTP errors/timeouts and recover on the next accepted heartbeat. |
| RS-SIM-NET-03 | One-shot mode shall exit nonzero if any required heartbeat fails; configuration errors shall also exit nonzero. |
| RS-SIM-NET-04 | Validate device count as an integer from 1 to 100; validate interval, request timeout and control port before starting. |
| RS-SIM-NET-05 | Schedule non-overlapping batches on a start-to-start cadence; skip elapsed slots when a batch exceeds the interval. |
| RS-SIM-NET-06 | Document backend Offline timeout as an explicit server policy: three times the common simulator interval for the three-missed-heartbeat scenario, plus sweep latency. |

## States and edge cases

- See screen states in SRS.md; keep errors and history inspectable.

## Acceptance criteria

- Test accepted/rejected/refused requests, stalled headers/body, recovery, invalid settings and slow batches.
