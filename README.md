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
|-- backend/                   Node.js API and local SQLite data model
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

## Local application preview

The Overview frontend now reads Fleet Summary through the Node.js API, so run
the application server rather than a standalone static Python server:

```powershell
npm.cmd start
```

Then open [http://localhost:4173/](http://localhost:4173/). A static server can render the page but
cannot serve `/api/v1/overview/summary`, so the KPI cards will be unavailable.

## Local backend and manual simulator data

Fleet Summary reads from a Node.js API and a local SQLite database. No physical
SDR is required: enter or edit simulator records directly in
`backend/data/sdr-management.db` with a SQLite editor, or start with the
tracked seed data. Use `backend/database/manual-entry.sql` as a safe copy/paste
template for a device, issue, or reconfiguration job.

```powershell
npm.cmd run db:init
npm.cmd run db:seed
npm.cmd start
```

Open [http://localhost:4173/](http://localhost:4173/). If that port is already
in use, choose another one for the current PowerShell session, for example:

```powershell
$env:PORT = '4174'
npm.cmd start
```

Then open [http://localhost:4174/](http://localhost:4174/).

The SQLite binary file is ignored by Git. The tables `devices`,
`device_issues`, and `reconfiguration_jobs` are intentionally also the future
integration boundary for an SDR Gateway: real telemetry will update those rows
with source `sdr_gateway`, and the existing Overview API will return the actual
counts without a frontend change.

## Backend skill

Use the project skill for Node.js APIs, SQLite schema changes, manual simulator
data, or future SDR Gateway ingestion:

```text
Use $sdr-backend to add an API for Device Management.
```

The skill is stored in `ai-skills/sdr-backend/` and validates the backend with:

```powershell
powershell -ExecutionPolicy Bypass -File ai-skills/sdr-backend/scripts/validate_backend.ps1
```

## Free Render preview

The repository includes `render.yaml` for a free Render web service. The cloud
service listens on Render's assigned `PORT`, exposes `/health` for health
checks, and seeds demo records when its SQLite database is empty.

The free service filesystem is ephemeral. It is suitable for reviewing the UI
and API, but manual database changes may be lost after a restart or redeploy.
Use persistent storage or a managed database before storing important data.
