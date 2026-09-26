# SDR Management frontend standards

Use this reference for new screens, shared visual-system changes, responsive
work, or design-fidelity review.

## 1. Current implementation surface

```text
frontend/
|-- index.html      Admin Dashboard shell with Overview active
|-- styles.css      Shared visual tokens and page styles
`-- scripts/
    |-- overview.js             Page initialization and shared snapshot lifecycle
    |-- fleet-summary.js        Fleet Summary rendering and section interactions
    |-- fleet-health.js         Fleet Health rendering and section interactions
    `-- system-performance.js   System Performance chart and range controls
```

Preserve this structure for small static changes. If another screen requires a
new HTML page, use a descriptive lowercase kebab-case filename and reuse the
shared stylesheet. Do not reorganize the entire frontend merely to add one
screen. Introduce shared asset or script folders only when actual files require
them.

### Section module ownership for every page

Keep each page section's DOM references, rendering, empty/error/stale states,
and local controls in its own module. The page entrypoint imports these modules
and supplies shared data. Section rendering must not accumulate in the page
entrypoint, and sections must not call each other's render functions.

Fetch each shared data source once per refresh and pass the same snapshot and
freshness state to its consumers. Shared validation and cache handling may
remain in the page coordinator or a shared data module. Extract reusable helpers
into shared modules rather than copying them between sections.

Use descriptive lowercase kebab-case names for each page and section. The tree
above documents existing files only; it is not a required list for other pages.
When implementing a new section's behavior, create its module and wire it through
the page coordinator. Static sections without JavaScript need no empty module.

Review module ownership as well as visual behavior. The frontend validator checks
local module imports across frontend JavaScript files. Also review that page
entrypoints own orchestration and each section owns its DOM and rendering;
import checks alone cannot prove that responsibility boundaries are correct.

## 2. Product and interface language

- Product: `SDR Management`.
- Current role: Administrator.
- Current environment: SDR Simulator.
- UI language: English.
- The shared header does not display a global `Live`, `Online`, or `Offline`
  connectivity badge.
- Device health labels: `Healthy`, `Warning`, `Offline`, and `Updating`.
  `Healthy` maps to the backend `health_status = online` value and must remain
  visually distinct from the `Online now` connectivity metric.
- Job states and action labels must match the screen requirements exactly.

## 3. Visual foundation

Reuse the variables already defined in `frontend/styles.css`. Current direction:

| Purpose | Token or value |
| --- | --- |
| Sidebar foundation | `--navy-950`, `--navy-900`, `--navy-800` |
| Primary action | `--blue-600`, `--blue-500` |
| Telemetry accent | `--cyan-500` |
| Healthy / online | `--green-600`, `--green-500` |
| Warning | `--amber-500` |
| Offline / critical | `--red-500` |
| Workspace | `--canvas` |
| Card surface | `--white` |
| Card radius | `--radius`, currently 12px |
| Typography | Inter with system UI fallbacks |

Keep the visual language operational and restrained: dark navigation, light
workspace, compact labels, clear numerical hierarchy, soft borders, and minimal
shadow. Avoid marketing-style hero sections, decorative gradients unrelated to
status, and oversized typography.

## 4. Layout rules

- Primary desktop design target: `1440 x 1024`.
- Minimum supported desktop width: 1024px.
- Sidebar starts at 232px and may reduce at narrower desktop widths.
- Use CSS Grid for page-level card layouts and Flexbox for local alignment.
- Prefer normal document flow. Do not absolutely position the entire screen to
  mimic a screenshot.
- Cards must tolerate longer data and should not clip status text.
- Tables may scroll horizontally on narrow viewports rather than collapsing
  unreadably.
- Mobile behavior may convert the sidebar into horizontally scrollable
  navigation when a mobile layout is within scope.

## 5. Semantic and accessible markup

- Use `aside` and `nav` for global navigation, `main` for the page, `header` for
  page context, and `section` or `article` for coherent panels.
- Use one page-level `h1`; card titles normally use `h2`.
- Use `button` for actions and `a` only for real navigation destinations.
- Mark the current navigation link with `aria-current="page"`.
- Planned or unavailable destinations must use a visible disabled state and
  must not point at missing fragments or pages.
- Label form controls. Tables use `th` with the appropriate scope.
- Charts need a concise accessible name even when the visual is SVG or CSS.
- Pair status colors with text, icons, patterns, or labels.
- Preserve visible keyboard focus and support `prefers-reduced-motion` when
  motion exists.

## 6. CSS conventions

- Put shared colors, radii, and shadows in `:root` variables.
- Prefer class selectors and avoid inline style attributes.
- Keep selectors shallow and component-oriented.
- Use `clamp()`, `minmax()`, and fluid grid tracks where they improve resilience.
- Add media queries around observed layout breakpoints, not arbitrary device
  names.
- Avoid `!important` except for tightly scoped accessibility overrides.
- Inline SVG is acceptable for data visualization geometry. Do not redraw a
  Figma icon when its real asset or an existing matching icon is available.

## 7. Static-prototype behavior

HTML/CSS prototypes must be honest about behavior:

- A visual button may remain non-functional when the task is visual-only, but
  handoff must state that limitation.
- Use native controls for visual states that can work without JavaScript, such
  as a time-range `select`.
- Do not add fake success messages, fake persistence, or deceptive navigation.
- Do not use `href="#"` for a destination. Point to a real fragment/page or use
  a disabled non-anchor element.

## 8. Local verification checklist

1. Start the Node.js application server from the project root when the page
   fetches backend data:

   ```powershell
   npm.cmd start
   ```

   A standalone static server is appropriate only for pages without API calls.

2. Confirm [http://localhost:4173/](http://localhost:4173/) and its API endpoint
   `http://localhost:4173/api/v1/overview/summary` return HTTP 200.
3. Render the page at `1440 x 1024` and compare hierarchy, spacing, colors,
   labels, and information density with Figma.
4. Render at 1024px wide and confirm there is no unusable overlap or clipping.
5. Inspect the semantic DOM and browser console.
6. Exercise available native controls and valid navigation targets.
7. Reload after each static file change because there is no hot reload.

Stop after resolving issues relevant to the requested screen. Do not expand a
static UI verification task into deployment, backend integration, or a frontend
framework migration.
