# RS-02 - Process controls

| Field | Value |
| --- | --- |
| Screen | SDR Simulator Console |
| FBS | FBS-3.1 |
| Priority | Must |

## Goal

Let testers control scenarios without obsolete requests corrupting current simulator state.

## Requirements

| ID | Requirement |
| --- | --- |
| RS-SIM-CTRL-01 | Pause shall stop future batches and cancel pending waits; Resume shall send promptly without changing the schedule when already running. |
| RS-SIM-CTRL-02 | Reset shall cancel old waits, clear local counters/history, restore auto modes and start a fresh batch; backend data shall remain intact. |
| RS-SIM-CTRL-03 | Mode changes shall cancel the affected pending wait and apply to the next batch; other devices shall continue. |
| RS-SIM-CTRL-04 | Late cancelled results shall not overwrite current state or count as accepted/failed. Explain that cancellation cannot undo backend ingestion. |
| RS-SIM-CTRL-05 | Shutdown shall cancel waits and close the Console promptly, without waiting for the heartbeat interval. |

## States and edge cases

- See screen states in SRS.md; keep errors and history inspectable.

## Acceptance criteria

- Exercise pause/resume/reset and each mode, including commands during an in-flight request and recovery after disconnected mode.
