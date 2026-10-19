# RS-04 - Page selection

| Field | Value |
| --- | --- |
| Screen | Device List |
| FBS | FBS-1.2, Page selection |
| Priority | Must |

## Goal

Page selection.

## Requirements

| ID | Requirement |
| --- | --- |
| RS-DEVLIST-SELECT-01 | Allow selection of individual rows or all rows on the current page with an indeterminate select-all state and selected count. |
| RS-DEVLIST-SELECT-02 | Clear selection on query/page change; on refresh retain only IDs still visible on the current page. |
| RS-DEVLIST-SELECT-03 | Offer Clear selection; identify bulk actions and Device Detail as planned; keep Add new device disabled until registration exists. |

## States and edge cases

- Empty/unavailable data shall not enable invalid controls; stale data is visibly labeled.

## Acceptance criteria

- Verify the requirements above with empty and populated data, keyboard controls, and refresh failures.
