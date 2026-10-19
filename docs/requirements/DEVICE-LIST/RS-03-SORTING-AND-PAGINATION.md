# RS-03 - Sorting and pagination

| Field | Value |
| --- | --- |
| Screen | Device List |
| FBS | FBS-1.2, Sorting and pagination |
| Priority | Must |

## Goal

Sorting and pagination.

## Requirements

| ID | Requirement |
| --- | --- |
| RS-DEVLIST-PAGE-01 | Default to name ascending; support ID, name, health priority, connection and last seen in both directions. Health ascending order is Offline, Warning, Updating, Healthy. |
| RS-DEVLIST-PAGE-02 | Break sort ties by device ID ascending. Last seen nulls sort last in both directions. |
| RS-DEVLIST-PAGE-03 | Provide 10/25/50/100 rows per page, default 25; count and rows use one DB snapshot. Clamp pages beyond the current last page. |
| RS-DEVLIST-PAGE-04 | Show range, total and page number. Disable unavailable previous/next; page-size changes return to page one. |

## States and edge cases

- Empty/unavailable data shall not enable invalid controls; stale data is visibly labeled.

## Acceptance criteria

- Verify the requirements above with empty and populated data, keyboard controls, and refresh failures.
