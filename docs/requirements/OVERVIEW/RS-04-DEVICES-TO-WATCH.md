# RS-04 - Devices to Watch

| Field | Value |
| --- | --- |
| Screen | Overview |
| FBS | FBS-1.1.4, Devices to watch |
| Priority | Must |

## Goal

Help the Administrator prioritize devices that require investigation.

## Requirements

| ID | Requirement |
| --- | --- |
| RS-OVW-WATCH-01 | The panel shall list devices in Warning or Offline state and other devices with active critical issues. |
| RS-OVW-WATCH-02 | Each item shall show device identity, state, issue summary, and last-seen time. |
| RS-OVW-WATCH-03 | Items shall be ordered by severity and then recency. |
| RS-OVW-WATCH-04 | Selecting an item shall open Device Detail when that screen is available. |
| RS-OVW-WATCH-05 | Selecting `View all` shall open Device Management with the `Needs attention` filter applied. |
| RS-OVW-WATCH-06 | The filtered destination shall include Warning and Offline devices plus devices with active critical issues. |
| RS-OVW-WATCH-07 | Until Device Management is implemented, `View all` shall be visibly unavailable and shall not navigate to a missing or misleading destination. |

## Acceptance criteria

- A simulated offline device appears ahead of lower-severity items.
- A healthy fleet displays an explicit no-devices-to-watch state.
- `View all` opens the complete needs-attention list without requiring the
  Administrator to reapply the filter.
