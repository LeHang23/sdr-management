# RS-05 - Inventory

| Field | Value |
| --- | --- |
| Screen | SDR Simulator Console |
| FBS | FBS-3.1 |
| Priority | Must |

## Goal

Inventory for virtual devices only.

## Requirements

| ID | Requirement |
| --- | --- |
| RS-SIM-INV-01 | Add, edit and remove virtual devices with unique SIM-SDR- IDs, display name, model and location; IDs are immutable after creation. |
| RS-SIM-INV-02 | Validate safe IDs, 1–100 character names, and a maximum of 100 devices. An empty fleet is valid. |
| RS-SIM-INV-03 | Persist configuration atomically when a state file is configured; fail instead of silently replacing corrupt saved data. |
| RS-SIM-INV-04 | Removing a device stops its sends and cancels pending waits; backend devices, telemetry and job history remain intact. |

## States and edge cases

Validation errors retain entered values. Backend failures preserve history and are shown as unavailable. Persistence failures reject the change.

## Acceptance criteria

Exercise valid/invalid inputs, restart recovery, backend failures and command redelivery; inspect source labels and credentials.
