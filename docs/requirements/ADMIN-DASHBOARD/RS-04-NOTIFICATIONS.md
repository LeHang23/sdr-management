# RS-04 - Notifications

| Field | Value |
| --- | --- |
| Screen | Admin Dashboard |
| FBS | FBS-1.0.4, Notifications |
| Priority | Should |

## Goal

Keep the Administrator aware of recent operational events requiring attention.

## Requirements

| ID | Requirement |
| --- | --- |
| RS-DASH-NOT-01 | The header shall provide a control for opening recent notifications. |
| RS-DASH-NOT-02 | The control shall indicate whether unread notifications exist. |
| RS-DASH-NOT-03 | Each notification shall show its type, summary, source, and timestamp. |
| RS-DASH-NOT-04 | Selecting a notification shall open the related record when available. |

## Acceptance criteria

- A simulator event can create an unread notification.
- Opening a linked notification navigates to its related record.
