# Software Requirements Specification - Device List

## 1. Screen information

| Field | Value |
| --- | --- |
| Screen | Device List |
| Role | Administrator |
| Design status | Implemented; dedicated Figma frame planned |
| Figma frame | Not available; existing Admin shell and tokens reused |
| FBS reference | FBS-1.2 |

## 2. Purpose

Enable the Administrator to find devices and inspect health, connection, source and last seen.

## 3. Preconditions

- The Node.js application and SQLite database are available.
- Administrator context is assumed until access management is implemented; hosted preview authentication applies.

## 4. Screen requirements

| ID | Requirement | Related RS |
| --- | --- | --- |
| SRS-DEVLIST-01 | Show ID/name, health, connection, source, last seen and needs-attention state. | RS-01-DEVICE-INVENTORY.md |
| SRS-DEVLIST-02 | Search ID/name and combine health, connection, source and Needs attention filters. | RS-02-SEARCH-AND-FILTERS.md |
| SRS-DEVLIST-03 | Provide deterministic sorting and server-side pagination. | RS-03-SORTING-AND-PAGINATION.md |
| SRS-DEVLIST-04 | Support selection on the current page without executing planned bulk actions. | RS-04-PAGE-SELECTION.md |

## 5. Screen states

| State | Expected behavior |
| --- | --- |
| Loading | Show a loading message; do not invent zero counts. |
| Ready | Render validated API data and its update time. |
| Empty fleet | Show No devices registered yet. |
| No matches | Show No devices match your search and filters. |
| Error / Offline | Show unavailable data with Retry; retain a labeled stale snapshot only for the same query. |
| Unauthorized | Indicate that sign-in is required; do not treat rejection as an empty fleet. |

## 6. Data and interaction

- Overview Devices navigation opens devices.html; Devices to Watch View all opens devices.html?attention=true.
- Queries persist in the URL and survive reload. Apply search with Search/Enter; selecting filters applies immediately.
- Refresh every 30 seconds while visible and on return/reconnection, with a 10-second request timeout. Obsolete requests cannot overwrite newer results.
- Filter/page changes clear selection and old results. Refresh retains selection only for IDs still on the current page.
- Add new device remains disabled; Device Detail and bulk actions are explicitly planned.

## 7. Non-functional screen requirements

- English copy; text labels for states; keyboard-accessible form, table and pagination.
- Usable at 1440 x 1024 and 1024px width; the table may scroll horizontally.
- Read-only API; parameterized search and allowlisted filters/sort; one read transaction for count and rows.

## 8. Acceptance summary

- Search, combined filters, sorting and pagination reflect stored records.
- Needs attention matches the Overview rule; recovery removes qualifying devices when no other condition remains.
- No broken Device Detail or registration routes.
