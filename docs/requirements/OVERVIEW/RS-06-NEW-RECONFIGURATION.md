# RS-06 - New Reconfiguration

| Field | Value |
| --- | --- |
| Screen | Overview |
| FBS | FBS-1.1.6, Reconfiguration action |
| Priority | Must |

## Goal

Provide a clear entry point for starting a safe remote reconfiguration workflow.

## Requirements

| ID | Requirement |
| --- | --- |
| RS-OVW-NEW-01 | The Overview page shall expose a prominent `New reconfiguration` action. |
| RS-OVW-NEW-02 | Selecting the action shall open the first step of the reconfiguration workflow. |
| RS-OVW-NEW-03 | The action shall be unavailable when the user lacks permission or the platform cannot safely create a job. |
| RS-OVW-NEW-04 | An unavailable action shall communicate the reason. |

## Acceptance criteria

- An eligible Administrator can enter the new-job workflow in one action.
- A disabled state explains why the workflow cannot be started.
