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

## Acceptance criteria

- Newly generated simulator alerts appear at the top.
- An empty alert dataset displays an explicit empty state.
- When the Alert inbox is available, selecting `All` opens the complete alert list without applying an implicit severity or resolution-status filter.
- Before the Alert inbox is available, `All` is not actionable by pointer or keyboard and is announced as unavailable.
