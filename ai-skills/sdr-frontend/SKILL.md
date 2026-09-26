---
name: sdr-frontend
description: Build, update, and locally verify SDR Management frontend screens from Figma and the screen requirements. Use for HTML/CSS UI implementation, responsive layout, accessibility, design matching, or frontend review inside this project; do not use for backend work or Figma-only editing.
metadata:
  short-description: Build SDR Management frontend screens
---

# SDR frontend workflow

Use this skill for the implementation side of SDR Management screens. Keep the
result aligned with the approved design, screen requirements, and the existing
static frontend conventions.

## Project invariants

- Product name is `SDR Management`. Never reintroduce `SDR Control Center` or
  `SDR Control` as the product name.
- Product interface copy is English unless the user explicitly requests another
  language.
- Application code belongs in `frontend/`. The `design/` directory contains
  design links only and must not contain HTML, CSS, JavaScript, SVG exports, or
  implementation assets.
- The current frontend baseline is plain HTML and CSS. Do not recreate the
  deleted React/Vite application, introduce a framework, install packages, or
  add JavaScript unless the requested behavior genuinely requires it and the
  user authorizes or asks for that change.
- Current data is from the SDR Simulator, not physical hardware. Simulated data
  must be recognizable in the UI.
- Every frontend page follows the same module ownership rules. Each implemented
  section with JavaScript behavior owns a separate module. Page entrypoints coordinate initialization,
  shared snapshot fetching, caching, and refresh scheduling; section rendering
  and section-specific interactions belong in their own modules.
- Sections sharing a data source receive the same snapshot and freshness state
  from the coordinator, without duplicate requests or calling each other's renderers.
- Name page and section modules after their actual responsibility using
  lowercase kebab-case. Extract reusable logic into shared modules. These rules
  apply to existing and future pages, with no fixed list of page or section names.

## Sources of truth

Before editing a screen, inspect these sources in this order:

1. The user's current request and explicit decisions.
2. The screen's English requirements in
   `docs/requirements/<SCREEN-NAME>/SRS.md` and local `RS-*.md` files.
3. `docs/requirements/FBS.md` for navigation, screen ownership, and delivery
   status.
4. The exact Figma frame linked from `design/DESIGN-LINKS.md` for visual intent.
5. Existing frontend tokens, layout patterns, and semantic markup.

For an Administrator page, inspect both `ADMIN-DASHBOARD/` for the shared shell
and the active page folder such as `OVERVIEW/`. Do not attribute page-specific
cards or actions to the shell merely because one Figma frame shows both.

Use the Vietnamese requirement tree for review and parity, not as a replacement
for the English implementation source. If Figma and requirements materially
conflict, preserve the requirement behavior and report the visual conflict
instead of silently inventing a resolution.

For implementation from a Figma frame, use the environment's Figma
design-to-code workflow and obtain design context before writing code when that
capability is available. Treat generated reference code as design evidence, not
as code to paste unchanged.

## Implementation workflow

1. Identify the exact screen folder, role, Figma frame, SRS requirements, and
   feature RS files in scope.
2. Inspect `frontend/` and reuse its CSS variables, cards, status semantics,
   spacing, typography, responsive rules, and semantic HTML patterns.
3. Implement the smallest complete screen requested. Do not create speculative
   routes, data models, or controls.
4. Represent loading, empty, error, offline, disabled, and permission states
   required by SRS. Do not make an unavailable destination look functional.
5. Keep navigation and actions honest: valid links must resolve, planned screens
   should be visibly disabled, and buttons must use the correct element type.
6. Verify locally through the Node.js application server when the screen uses
   an API, then inspect the rendered screen in a browser at the primary Figma
   size and the minimum supported desktop width. Do not use a standalone static
   server for API-backed screens.
7. Fix console errors, overflow, clipped content, broken anchors, inaccessible
   controls, and meaningful design mismatches before handoff.
8. Run the deterministic checks:

```powershell
powershell -ExecutionPolicy Bypass -File ai-skills/sdr-frontend/scripts/validate_frontend.ps1
```

Read [references/frontend-standards.md](references/frontend-standards.md) when
creating a new screen, changing section modules, changing shared visual tokens, adding responsive behavior,
or reviewing design fidelity.

## Handoff criteria

- The requested screen is recognizable against the Figma reference.
- Every implemented UI group traces to its SRS or RS requirement.
- The page loads through a local HTTP server with a successful response and no
  blocking console error.
- Desktop layout is checked at `1440 x 1024` and remains usable at 1024px wide.
- Status meaning does not rely on color alone; keyboard focus and semantic
  labels are present for interactive controls.
- Report the local URL and the files changed. Keep the local server running when
  the user asked to review the result immediately.

## Boundaries

- Local frontend work does not authorize deployment or hosting.
- Do not edit the live Figma file during a code-only request.
- Do not modify requirements merely to make the implementation easier. Use the
  requirements skill when documentation itself must change.
- Do not claim an interaction works when the current HTML/CSS prototype only
  renders its visual state.
