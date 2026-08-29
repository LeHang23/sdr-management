# SDR Management

SDR Management is a web-based platform for managing, monitoring, and
remotely reconfiguring Software-Defined Radio devices.

The project currently focuses on the Administrator experience. An SDR simulator
will provide device states, telemetry, alerts, and reconfiguration results until
physical hardware is available.

## Project structure

```text
sdr-management/
|-- ai-skills/                 Project-specific AI workflows
|-- design/                    Figma links only
|-- frontend/                  Static HTML/CSS interface prototype
`-- docs/
    |-- requirements/
    |   |-- FBS.md             English feature breakdown
    |   |-- ADMIN-DASHBOARD/   Shared Administrator application shell
    |   |   |-- SRS.md
    |   |   `-- RS-*.md
    |   `-- OVERVIEW/          Overview page inside the Admin shell
    |       |-- SRS.md
    |       `-- RS-*.md
    `-- requirements_vi/
        |-- FBS.md             Vietnamese feature breakdown
        |-- ADMIN-DASHBOARD/   Mirrors the English shell folder
        `-- OVERVIEW/          Mirrors the English page folder
```

## Documentation rules

- English documents are the primary implementation references.
- Vietnamese documents mirror the English structure and requirement IDs.
- `FBS.md` is the shared feature hierarchy for the whole product.
- Create one folder per screen, named after the screen, such as
  `ADMIN-DASHBOARD/` or `DEVICE-DETAIL/`.
- Store one whole-screen `SRS.md` and numbered feature files such as
  `RS-01-GLOBAL-NAVIGATION.md` inside that screen folder.
- When another role uses a different screen, add the screen to FBS and create
  another self-contained screen folder using the same structure.
- Store only canonical design links in `design/`; implementation code belongs
  in the application source directories created during development.

## Requirements skill

Use the project skill when adding or changing requirement documentation:

```text
Use $sdr-requirements to document the Device Detail screen.
```

The skill is stored in `ai-skills/sdr-requirements/`. It maintains the mirrored
English and Vietnamese screen folders and validates their structure with:

```powershell
powershell -ExecutionPolicy Bypass -File ai-skills/sdr-requirements/scripts/validate_requirements.ps1
```

## Frontend skill

Use the project skill when implementing or reviewing an SDR Management screen:

```text
Use $sdr-frontend to implement the Device Detail screen from Figma and its requirements.
```

The skill is stored in `ai-skills/sdr-frontend/` and validates the static
frontend with:

```powershell
powershell -ExecutionPolicy Bypass -File ai-skills/sdr-frontend/scripts/validate_frontend.ps1
```

## Current design

The first designed frame combines the Admin Dashboard shell with the Overview
page. Their requirements are tracked in separate screen folders. See
[`design/DESIGN-LINKS.md`](design/DESIGN-LINKS.md) for the Figma reference.

## Local frontend preview

The current prototype renders the Admin Dashboard shell with Overview active,
using plain HTML and CSS in `frontend/`.
Run it locally from the project root:

```powershell
python -m http.server 4173 --directory frontend
```

Then open `http://127.0.0.1:4173/`.
