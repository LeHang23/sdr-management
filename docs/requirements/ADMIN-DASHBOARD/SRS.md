# Software Requirements Specification - Admin Dashboard Shell

## 1. Screen information

| Field | Value |
| --- | --- |
| Screen | Admin Dashboard shell |
| Role | Administrator |
| Design status | Designed |
| Figma frame | Admin / Overview, shared shell region, 1440 x 1024 |
| FBS reference | FBS-1.0 through FBS-1.0.5 |

## 2. Purpose

The Admin Dashboard is the shared application shell for Administrator pages. It
provides persistent navigation, global search, notifications, and Administrator
account context around the active page.

## 3. Preconditions

- The administrator workspace has loaded successfully.
- Demo data is provided by the SDR Simulator until physical devices are
  integrated.
- Authentication is deferred; the screen currently assumes an Administrator
  context.

## 4. Screen requirements

| ID | Requirement | Related RS |
| --- | --- | --- |
| SRS-DASH-01 | The screen shall provide navigation to all administrator modules and visibly identify the active module. | RS-01-GLOBAL-NAVIGATION.md |
| SRS-DASH-03 | The header shall provide global search access. | RS-03-GLOBAL-SEARCH.md |
| SRS-DASH-04 | The header shall provide access to recent notifications and indicate unread notifications. | RS-04-NOTIFICATIONS.md |
| SRS-DASH-05 | The header shall identify the current Administrator and provide access to the profile menu. | RS-05-ADMIN-PROFILE.md |

## 5. Screen states

| State | Expected behavior |
| --- | --- |
| Loading | Display the shell without layout shift while the active page and shared account data load. |
| Ready | Display the active page inside persistent navigation and header regions. |
| Partially unavailable | Keep available shell controls usable and mark unavailable shared services explicitly. |
| Unauthorized | Prevent protected pages from rendering and route to the future access-control flow. |

## 6. Data refresh and interaction

- Selecting an enabled navigation destination shall update the active page and
  the programmatic current-page state.
- Search results and notifications shall open their corresponding destination
  when that destination is available.

## 7. Non-functional screen requirements

- The shared shell shall remain stable while the active page changes.
- The desktop shell shall remain usable from a 1024px viewport width, with
  1440px as the primary design target.
- Core controls shall be keyboard accessible and expose accessible names.
- The screen shall use English interface copy and support future localization.

## 8. Acceptance summary

- An Administrator can identify the active page and reach every enabled admin
  destination.
- Unavailable shared controls are clearly indicated without adding a global connectivity badge.
- Every shared shell group traces to a numbered RS feature file in this folder.
