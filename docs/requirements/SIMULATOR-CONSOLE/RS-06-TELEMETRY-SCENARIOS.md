# RS-06 - Telemetry and transport scenarios

| Field | Value |
| --- | --- |
| Screen | SDR Simulator Console |
| FBS | FBS-3.1 |
| Priority | Must |

## Goal

Telemetry and transport scenarios for virtual devices only.

## Requirements

| ID | Requirement |
| --- | --- |
| RS-SIM-SCN-01 | Allow finite throughput overrides from 0 to 100000 Mbps and SNR from -200 to 200 dB. Blank values restore automatic telemetry. |
| RS-SIM-SCN-02 | Network loss and request timeout scenarios shall send no request to the backend, display the simulated fault and recover when Normal is selected. |
| RS-SIM-SCN-03 | Store overrides and fault scenarios with device configuration. Reset clears counters, restores auto/normal and clears overrides but retains inventory and command receipts. |

## States and edge cases

Validation errors retain entered values. Backend failures preserve history and are shown as unavailable. Persistence failures reject the change.

## Acceptance criteria

Exercise valid/invalid inputs, restart recovery, backend failures and command redelivery; inspect source labels and credentials.
