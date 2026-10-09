# RS-05 - Recent Alerts

| Field | Value |
| --- | --- |
| Screen | Overview |
| FBS | FBS-1.1.5, Recent alerts |
| Priority | Must |

## Goal

Provide immediate awareness of the latest fleet incidents.

## Requirements

| ID | Requirement |
| --- | --- |
| RS-OVW-ALT-01 | The panel shall list recent alerts from newest to oldest. |
| RS-OVW-ALT-02 | Each alert shall show severity, summary, source, and occurrence time. |
| RS-OVW-ALT-03 | Severity shall be communicated by text or icon in addition to color. |
| RS-OVW-ALT-04 | Selecting an alert shall open Alert Detail when that screen is available. |
| RS-OVW-ALT-05 | The panel header shall provide an action labelled `All` for access to the complete Alert inbox. |
| RS-OVW-ALT-06 | Selecting `All` shall open the Alert inbox with all alerts shown newest first when that destination is available. |
| RS-OVW-ALT-07 | Until the Alert inbox is available, `All` shall be visibly disabled, expose its unavailable state to assistive technology, and shall not navigate to an unrelated or broken destination. |
| RS-OVW-ALT-08 | The preview shall show up to three alerts of all severities and resolution states, newest occurrence first with alert ID breaking ties; show the full unresolved count and the full total when the preview is truncated. |
| RS-OVW-ALT-09 | Accepted gateway Warning/Offline health and backend-confirmed heartbeat expiry shall open an incident. Repeated identical health shall not duplicate or reorder it. Recovery to Healthy/Updating shall resolve only the generated incident; a different unhealthy state or later recurrence shall open a new incident and retain previous history. |
| RS-OVW-ALT-10 | Recent Alerts shall use the same snapshot and freshness state as Fleet Summary, Fleet Health, and Devices to Watch, with loading, empty, unavailable/Retry, cached/stale, and recovery states. An unavailable source shall not display fabricated zero alerts. |
| RS-OVW-ALT-11 | Each item shall identify its device and data source as manual input, remote simulator, or SDR Gateway, and display Active/Resolved status plus absolute occurrence time; resolving an alert shall not move its original occurrence to the top. |
| RS-OVW-ALT-12 | Automatic health incidents shall use Warning severity for Warning health and Critical severity for Offline health. Manual findings shall retain their severity and lifecycle, and shall not be automatically resolved by heartbeats. |

## Acceptance criteria

- Newly generated simulator alerts appear at the top.
- An empty alert dataset displays an explicit empty state.
- When the Alert inbox is available, selecting `All` opens the complete alert list without applying an implicit severity or resolution-status filter.
- Before the Alert inbox is available, `All` is not actionable by pointer or keyboard and is announced as unavailable.
- Repeated Warning/Offline updates create one incident; expiry/recovery and recurrence preserve the incident history and accurate unresolved count.
- Refresh failures preserve the last snapshot with a stale label; Retry restores fresh data without a second section-specific fetch.
