# Feature Breakdown Structure

## 1. Purpose

This Feature Breakdown Structure decomposes SDR Management into product
areas, modules, screens, and feature groups. It answers where a capability
belongs in the product. Each screen has its own folder containing `SRS.md` and
its numbered RS feature files.

## 2. Feature hierarchy

```text
SDR Management
|-- 1. Admin Workspace
|   |-- 1.0 Admin Dashboard shell
|   |   |-- Global navigation
|   |   |-- Global search
|   |   |-- Notifications
|   |   `-- Admin profile
|   |-- 1.1 Overview
|   |   |-- Fleet summary
|   |   |-- System performance
|   |   |-- Fleet health
|   |   |-- Devices to watch
|   |   |-- Recent alerts
|   |   `-- New reconfiguration entry point
|   |-- 1.2 Device Management
|   |   |-- Device list
|   |   |-- Add new device entry point
|   |   |-- Device registration and editing
|   |   |-- Device detail
|   |   `-- Simulator controls
|   |-- 1.3 Reconfiguration Management
|   |   |-- Job list
|   |   |-- New job wizard
|   |   |-- Job detail and progress
|   |   |-- Verification and performance comparison
|   |   `-- Retry and rollback
|   |-- 1.4 Firmware Management
|   |   |-- Package library
|   |   |-- Package upload and validation
|   |   `-- Package detail and lifecycle
|   |-- 1.5 Configuration Management
|   |   |-- Profile library
|   |   |-- Profile editor and validation
|   |   `-- Profile detail and version history
|   |-- 1.6 Monitoring and Alerts
|   |   |-- Fleet monitoring
|   |   |-- Alert inbox
|   |   `-- Alert detail and resolution
|   `-- 1.7 Audit
|       |-- Audit event list
|       `-- Audit event detail
|-- 2. Access Management
|   |-- 2.1 Authentication
|   |-- 2.2 Users
|   |-- 2.3 Roles and Permissions
|   `-- 2.4 User Profile
`-- 3. Platform Support
    |-- 3.1 SDR Simulator
    |-- 3.2 Device Gateway
    |-- 3.3 Notifications
    `-- 3.4 System Settings
```

## 3. Surface-level feature breakdown

| FBS ID | Product area / screen | Feature group | Included features | Status |
| --- | --- | --- | --- | --- |
| FBS-1.0 | Admin Dashboard | Application shell | Persistent sidebar and shared header surrounding the active Administrator page | Designed |
| FBS-1.0.1 | Admin Dashboard | Global navigation | Overview, Devices, Reconfiguration, Monitoring, Firmware, Config profiles, Alerts, Audit log | Designed |
| FBS-1.0.3 | Admin Dashboard | Global search | Search access for devices, jobs, firmware, and configuration profiles | Designed |
| FBS-1.0.4 | Admin Dashboard | Notifications | Unread indicator, recent notifications, and related-record navigation | Designed |
| FBS-1.0.5 | Admin Dashboard | Admin profile | Current Administrator identity and account menu access | Designed |
| FBS-1.1 | Overview | Page overview | Fleet condition, performance, devices requiring attention, recent alerts, and reconfiguration entry | Designed |
| FBS-1.1.1 | Overview | Fleet summary | Total devices, online devices, devices needing attention, active jobs | Designed |
| FBS-1.1.2 | Overview | System performance | Throughput and SNR trends, time-range control, chart legend | Designed |
| FBS-1.1.3 | Overview | Fleet health | Online, Warning, Offline, and Updating distribution | Designed |
| FBS-1.1.4 | Overview | Devices to watch | Prioritized device list, state, issue summary, last seen, detail action, and `View all` navigation to the filtered Device Management list | Designed |
| FBS-1.1.5 | Overview | Recent alerts | Severity, alert summary, source, time, navigation to alert detail, and `All` access to the complete Alert inbox | Designed |
| FBS-1.1.6 | Overview | Reconfiguration action | New reconfiguration call to action | Designed |
| FBS-1.2 | Devices | Device list | Search, filters, sorting, pagination, health and connection status, bulk selection | Planned |
| FBS-1.2.1 | Device form | Device administration | Register, edit, enable, disable, and label a simulated or physical device | Planned |
| FBS-1.2.2 | Device detail | Overview | Identity, model, location, health, connectivity, installed versions, last seen | Planned |
| FBS-1.2.3 | Device detail | Monitoring | Live metrics, historical charts, metric time range, active alerts | Planned |
| FBS-1.2.4 | Device detail | Changes and history | Configuration, firmware, reconfiguration history, audit activity | Planned |
| FBS-1.2.5 | Device Management | Add new device | Primary action opens the future device-registration flow for a simulated or physical SDR device, with required-field validation, save, and cancel outcomes | Planned |
| FBS-1.3 | Reconfiguration jobs | Job list | Status filters, target count, artifact versions, creator, progress, result | Planned |
| FBS-1.3.1 | New reconfiguration | Target selection | Single or multiple devices, search, compatibility summary | Planned |
| FBS-1.3.2 | New reconfiguration | Artifact selection | Firmware package, configuration profile, version and compatibility details | Planned |
| FBS-1.3.3 | New reconfiguration | Validation and review | Availability, integrity, compatibility, recovery checks, confirmation | Planned |
| FBS-1.3.4 | Job detail | Deployment progress | Job state, per-device steps, timeline, logs, cancel rules | Planned |
| FBS-1.3.5 | Job detail | Verification | Pre-change and post-change metrics, absolute and percentage difference | Planned |
| FBS-1.3.6 | Job detail | Recovery | Retry failed targets and roll back eligible targets | Planned |
| FBS-1.4 | Firmware | Package library | Search, version, compatibility, lifecycle state, release date | Planned |
| FBS-1.4.1 | Firmware form | Package management | Upload, metadata, checksum, compatibility, validation, release notes | Planned |
| FBS-1.4.2 | Firmware detail | Package history | Version detail, deployments, results, lifecycle actions | Planned |
| FBS-1.5 | Config profiles | Profile library | Search, version, compatibility, lifecycle state | Planned |
| FBS-1.5.1 | Profile editor | Configuration authoring | Schema-based parameters, validation, versioning, change summary | Planned |
| FBS-1.5.2 | Profile detail | Profile history | Version detail, deployments, results, lifecycle actions | Planned |
| FBS-1.6 | Monitoring | Fleet telemetry | Device selection, metrics, time range, aggregate and per-device charts | Planned |
| FBS-1.6.1 | Alerts | Alert inbox | Severity and status filters, acknowledgement, assignment, resolution | Planned |
| FBS-1.6.2 | Alert detail | Investigation | Source, timeline, telemetry context, related job, resolution notes | Planned |
| FBS-1.7 | Audit log | Event list | Search, actor, action, target, outcome, time range, export | Planned |
| FBS-1.7.1 | Audit detail | Event inspection | Before and after values, correlation ID, related records | Planned |
| FBS-2.1 | Login | Authentication | Sign in, session errors, password recovery | Deferred |
| FBS-2.2 | Users | User management | Invite, edit, activate, deactivate, role assignment | Deferred |
| FBS-2.3 | Roles | Authorization | Roles, permissions, protected action mapping | Deferred |
| FBS-3.1 | Simulator | Scenario control | Device generation, telemetry patterns, state changes, job outcomes | Planned |
| FBS-3.4 | System settings | Platform configuration | Thresholds, retention, notification rules, environments | Planned |

## 4. Current Admin Dashboard shell and Overview UI groups

The current Figma frame shows the Admin Dashboard shell with Overview loaded as
its active page. The groups remain separate for requirement traceability.

| UI group | User purpose | Primary content or action | Related SRS |
| --- | --- | --- | --- |
| Admin Dashboard / Sidebar | Move between administrator modules | Navigation links and active page | SRS-DASH-01 |
| Admin Dashboard / Shared header | Use platform-wide controls | Breadcrumb, search, notifications, profile | SRS-DASH-03 through SRS-DASH-05 |
| Overview / KPI cards | Assess fleet condition quickly | Total devices, online now, needs attention, active jobs | SRS-OVW-01 |
| Overview / System Performance | Observe operational trends | Throughput and SNR chart with time range | SRS-OVW-02 |
| Overview / Fleet Health | Understand device-state distribution | Online, Warning, Offline, Updating | SRS-OVW-03 |
| Overview / Devices to Watch | Prioritize investigation | Device state, issue, last seen, detail link, filtered `View all` | SRS-OVW-04 |
| Overview / Recent Alerts | Review latest incidents and access the complete inbox | Severity, summary, source, time, alert detail, `All` | SRS-OVW-05 |
| Overview / New Reconfiguration | Begin a remote change | Primary action opening the job workflow | SRS-OVW-06 |

## 5. Document relationships

| Document | Primary question | Level |
| --- | --- | --- |
| Screen folder / `RS-*.md` | What outcome and capability is required for each feature? | Feature and stakeholder |
| Screen folder / `SRS.md` | What verifiable behavior and quality shall the screen provide? | Software screen |
| `FBS.md` | How are capabilities decomposed across modules, screens, and UI groups? | Feature structure |

When a screen is added, update this hierarchy and create a folder named after
the screen. Store its `SRS.md` and numbered `RS-*.md` files together there.
