---
name: sdr-figma
description: Design and review the SDR Management UI in Figma, keep the dashboard language and visual system consistent, and hand approved frames to implementation.
metadata:
  short-description: Work safely on SDR dashboard Figma files
---

# SDR Figma workflow

Use this skill when designing, translating, reviewing, or handing off the SDR
Management interface in Figma. The current priority is the Admin Dashboard
shell with Overview active; login and end-user screens are later scopes.

## Product context

- Product: SDR Management, a remote fleet management and reconfiguration platform.
- Current demo data comes from an SDR Simulator, not physical hardware.
- Primary frame: `Admin / Overview`, desktop size `1440 × 1024`; it visually combines
  the Admin Dashboard shell and the Overview page.
- Product UI copy is English. Use sentence case except for navigation section
  labels and telemetry/status values.
- Shell areas: global navigation and shared header controls.
- Overview areas: fleet KPIs, realtime throughput/SNR, fleet health, devices to
  watch, recent alerts, and the new reconfiguration entry point.
- The shared header contains breadcrumb context, search, and the Administrator
  avatar. Do not display a global `LIVE`, `ONLINE`, or `OFFLINE` badge.

## Required working rules

1. Work in the user's Figma web tab, not an unconnected desktop window.
2. Verify the exact file and frame before editing. Do not guess a tab or node.
3. Inspect the visible canvas before each consequential action and take a fresh
   screenshot after placement or layout changes.
4. Keep product UI copy in English. Do not maintain duplicate local Vietnamese
   design exports; `design/` contains links only.
5. Keep the dashboard at `1440 × 1024`; align imported content to the frame's
   top-left (`X = 0`, `Y = 0`) and keep the frame's clipping behavior.
6. Build and review screens directly in Figma. Keep exported assets and
   implementation code outside `design/`.
7. Do not change file sharing, team permissions, or unrelated pages.

## Visual system

- Dark navy operations sidebar; light workspace; blue primary action; cyan
  telemetry accent.
- Status colors: green = healthy/online, amber = warning, red = offline/error,
  blue = updating.
- Desktop layout: 232px sidebar, 72px top bar, 32px content padding, 12-column
  grid, 20px gutters, 12px card radius.
- Typography: Inter; use a restrained hierarchy and tabular numerals for live
  metrics.

## Handoff

For implementation, give Codex the exact Figma frame link and request design
context plus a screenshot before coding. Reuse the repository's components and
tokens, then compare the result in a real browser and iterate against the
Figma reference.

Read [references/live-workflow.md](references/live-workflow.md) for the detailed
connection, SVG placement, verification, and handoff procedure.
