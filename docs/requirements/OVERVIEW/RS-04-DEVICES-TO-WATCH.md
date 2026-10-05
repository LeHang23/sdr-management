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
| RS-OVW-WATCH-03 | Items shall be ordered by active critical issue first, Offline next, then Warning; within each priority, the selected issue update time (or device update time when no active issue exists) shall be newest first, with device ID breaking ties. |
| RS-OVW-WATCH-04 | Selecting an item shall open Device Detail when that screen is available. |
| RS-OVW-WATCH-05 | Selecting `View all` shall open Device Management with the `Needs attention` filter applied. |
| RS-OVW-WATCH-06 | The filtered destination shall include Warning and Offline devices plus devices with active critical issues. |
| RS-OVW-WATCH-07 | Until Device Management is implemented, `View all` shall be visibly unavailable and shall not navigate to a missing or misleading destination. |
| RS-OVW-WATCH-08 | The Overview preview shall show at most five unique devices and indicate the full needs-attention count when more devices qualify. |
| RS-OVW-WATCH-09 | For devices with multiple active issues, show the most severe issue, then the newest issue within that severity. Resolved issues shall not qualify a device or supply its issue summary. Without an active issue, show a state-based summary; missing last-seen time shall display `Never seen`. |
| RS-OVW-WATCH-10 | The list and Fleet Summary shall use the same snapshot and freshness state. Show loading, a healthy-fleet empty message, unavailable data with Retry, and clearly labeled cached data after a refresh failure. |

## Acceptance criteria

- A simulated offline device appears ahead of lower-severity items.
- A healthy fleet displays an explicit no-devices-to-watch state.
- `View all` opens the complete needs-attention list without requiring the
  Administrator to reapply the filter.
