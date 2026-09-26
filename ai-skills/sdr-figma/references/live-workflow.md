# Live Figma workflow for SDR Management

## Connect the user's tab

Use a connected Chrome/Edge tab with the Figma web editor open. The tab must be
shared with the current Codex session and the user must have edit access. If no
browser is available, ask the user to enable the ChatGPT/Codex browser
extension and share the tab; do not claim that the Figma link itself grants
control.

Before editing, verify:

- the visible file title is the intended SDR project;
- the URL contains the expected Figma file and `node-id`;
- the target layer is the `Admin / Overview` frame;
- the frame dimensions are `1440 × 1024`.

## First visual pass

Build the review screen directly in the connected Figma file. Confirm that all
created nodes are nested inside `Admin / Overview`, use the frame origin consistently,
and keep the complete sidebar and workspace visible.

Store only the canonical Figma reference in `design/DESIGN-LINKS.md`. Do not
place HTML, SVG exports, image exports, or implementation code in `design/`.

## SDR Admin shell and Overview review checklist

- Sidebar contains Overview, Devices, Reconfiguration, Monitoring, Firmware,
  Config profiles, Alerts, and Audit log.
- Header shows breadcrumb, search, notifications, and Admin avatar without a
  global connectivity badge.
- KPI row shows Total devices, Online now, Needs attention, and Active jobs.
- Main chart compares Throughput (Mbps) and SNR (dB).
- Fleet health distinguishes Healthy, Warning, Offline, and Updating; Healthy
  is separate from the Online now connectivity metric.
- Lower panels show Devices to watch and Recent alerts.
- Primary action is **New reconfiguration**.
- Treat sidebar and shared header as Admin Dashboard shell content; treat KPI,
  performance, fleet health, device, alert, and reconfiguration panels as the
  Overview page for documentation traceability.
- English copy has no Vietnamese diacritics or mixed-language headings.
- No content is clipped at the frame edge; the imported group is aligned to
  the frame and the canvas screenshot is clean before handoff.

## Code handoff prompt

```text
Implement the selected Figma frame in the current project.
- Start with the exact frame's design context and screenshot.
- Preserve the SDR dashboard hierarchy, spacing, typography, color tokens,
  status semantics, and responsive behavior.
- Reuse existing project components instead of creating a parallel system.
- Keep the interface copy in English.
- Validate the finished page against the Figma screenshot in a real browser.
```
