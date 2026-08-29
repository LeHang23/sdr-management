# RS-03 - Global Search

| Field | Value |
| --- | --- |
| Screen | Admin Dashboard |
| FBS | FBS-1.0.3, Global search |
| Priority | Should |

## Goal

Allow an Administrator to quickly locate operational records from the header.

## Requirements

| ID | Requirement |
| --- | --- |
| RS-DASH-SRCH-01 | Search shall accept a device name, device ID, job ID, firmware version, or configuration profile name. |
| RS-DASH-SRCH-02 | Search shall indicate when no matching record exists. |
| RS-DASH-SRCH-03 | Selecting a result shall open the corresponding detail screen. |
| RS-DASH-SRCH-04 | Search input and results shall be keyboard accessible. |

## Acceptance criteria

- A known simulated device can be found by both name and ID.
- An unknown term produces an explicit empty result.
