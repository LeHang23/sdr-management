# RS-03 - Fleet Health

| Field | Value |
| --- | --- |
| Screen | Overview |
| FBS | FBS-1.1.3, Fleet health |
| Priority | Must |

## Goal

Show how the fleet is distributed across operational health states.

## Requirements

| ID | Requirement |
| --- | --- |
| RS-OVW-HLT-01 | Fleet Health shall show Online, Warning, Offline, and Updating categories. |
| RS-OVW-HLT-02 | Category counts shall add up to the Total devices value for the same snapshot. |
| RS-OVW-HLT-03 | Every category shall use a text label in addition to status color. |
| RS-OVW-HLT-04 | A zero-count category shall remain identifiable. |

## Acceptance criteria

- Simulator state changes update the correct category.
- Category totals reconcile with Total devices.
