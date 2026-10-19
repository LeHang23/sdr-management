# RS-02 - Search and filters

| Field | Value |
| --- | --- |
| Screen | Device List |
| FBS | FBS-1.2, Search and filters |
| Priority | Must |

## Goal

Search and filters.

## Requirements

| ID | Requirement |
| --- | --- |
| RS-DEVLIST-FILTER-01 | Search ID or name by literal substring, ignoring ASCII case; trim outer whitespace and limit to 100 characters. |
| RS-DEVLIST-FILTER-02 | Combine health, connection, source and Needs attention filters using AND. All resets an individual filter. |
| RS-DEVLIST-FILTER-03 | Needs attention includes Warning/Offline health or an active critical issue, including Healthy/Updating devices; ignore resolved issues and count each device once. |
| RS-DEVLIST-FILTER-04 | Applying filters resets page to one and selection. Clear filters restores defaults. Preserve query in URL; Overview View all applies attention=true. |

## States and edge cases

- Empty/unavailable data shall not enable invalid controls; stale data is visibly labeled.

## Acceptance criteria

- Verify the requirements above with empty and populated data, keyboard controls, and refresh failures.
