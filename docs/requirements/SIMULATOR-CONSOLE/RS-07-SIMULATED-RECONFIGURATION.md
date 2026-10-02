# RS-07 - Simulated reconfiguration

| Field | Value |
| --- | --- |
| Screen | SDR Simulator Console |
| FBS | FBS-3.1 |
| Priority | Must |

## Goal

Simulated reconfiguration for virtual devices only.

## Requirements

| ID | Requirement |
| --- | --- |
| RS-SIM-JOB-01 | Queue authenticated commands for registered SIM-SDR- targets with throughput/SNR settings; reject physical or unknown targets. |
| RS-SIM-JOB-02 | Correlate each command/result with its job and device ID, show per-target states and aggregate the durable reconfiguration job lifecycle. |
| RS-SIM-JOB-03 | Support success, failure and no-result timeout. Success persists telemetry overrides; failure/timeout do not apply them. Paused/disconnected/faulted devices do not execute commands. |
| RS-SIM-JOB-04 | Deduplicate creation by job ID and reject conflicting targets/configuration. Save application receipts atomically with configuration; redelivery/restart resends results without reapplying. |
| RS-SIM-JOB-05 | Job timeout is 1000–300000 ms measured from creation, including queue/pause time. A timed-out target is terminal; the aggregate job is failed. |
| RS-SIM-JOB-06 | Keep Bearer credentials server-side, protect Console writes against cross-site requests, and label every job as simulated. No physical SDR or firmware changes are claimed. |

## States and edge cases

Validation errors retain entered values. Backend failures preserve history and are shown as unavailable. Persistence failures reject the change.

## Acceptance criteria

Exercise valid/invalid inputs, restart recovery, backend failures and command redelivery; inspect source labels and credentials.
