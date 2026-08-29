# SDR requirements document schema

Use this reference when creating a screen folder, adding feature RS files, or
restructuring requirement documentation.

## 1. Naming

| Item | Pattern | Example |
| --- | --- | --- |
| Screen folder | `<SCREEN-NAME>/` | `ADMIN-DASHBOARD/` |
| Screen specification | `SRS.md` | `ADMIN-DASHBOARD/SRS.md` |
| Feature specification | `RS-<ORDER>-<FEATURE-NAME>.md` | `OVERVIEW/RS-01-FLEET-SUMMARY.md` |
| Screen requirement ID | `SRS-<SCREEN-CODE>-<NN>` | `SRS-OVW-01` |
| Feature requirement ID | `RS-<SCREEN-CODE>-<FEATURE-CODE>-<NN>` | `RS-OVW-SUM-01` |

Use at least two digits for file ordering. File ordering communicates reading
order only; stable requirement IDs provide traceability.

Treat an application shell and its active page as separate screens. For
example, shared navigation and header requirements belong in
`ADMIN-DASHBOARD/`, while fleet summary and monitoring panels belong in
`OVERVIEW/`, even when one Figma frame displays them together.

## 2. FBS content

The global FBS must contain:

1. Purpose and boundaries.
2. Product-wide feature hierarchy.
3. Screen-level feature breakdown with stable FBS IDs.
4. Current UI groups for designed screens.
5. Document relationships and maintenance rule.

Use delivery states consistently: `Designed`, `Planned`, or `Deferred` in
English and their established Vietnamese equivalents in the mirrored file.

## 3. SRS template

```markdown
# Software Requirements Specification - <Screen name>

## 1. Screen information

| Field | Value |
| --- | --- |
| Screen | <Screen name> |
| Role | <Role or roles> |
| Design status | <Designed, Planned, Deferred> |
| Figma frame | <Frame link/name or Not available> |
| FBS reference | <FBS IDs> |

## 2. Purpose

<What the screen enables and why it exists.>

## 3. Preconditions

- <Required context or dependency.>

## 4. Screen requirements

| ID | Requirement | Related RS |
| --- | --- | --- |
| SRS-<SCREEN>-01 | <Externally verifiable screen behavior.> | RS-01-<FEATURE>.md |

## 5. Screen states

| State | Expected behavior |
| --- | --- |
| Loading | <Behavior> |
| Ready | <Behavior> |
| Empty | <Behavior> |
| Error | <Behavior> |
| Offline | <Behavior when applicable> |
| Unauthorized | <Behavior when applicable> |

## 6. Data and interaction

- <Refresh, navigation, selection, validation, or persistence behavior.>

## 7. Non-functional screen requirements

- <Performance, accessibility, responsiveness, localization, or security.>

## 8. Acceptance summary

- <Observable screen-level success criterion.>
```

Omit a state only when it genuinely cannot occur. Do not replace unknown
behavior with invented requirements.

## 4. RS template

```markdown
# RS-<ORDER> - <Feature name>

| Field | Value |
| --- | --- |
| Screen | <Screen name> |
| FBS | <FBS ID and UI group> |
| Priority | <Must, Should, Could> |

## Goal

<Single user or product outcome for this feature.>

## Requirements

| ID | Requirement |
| --- | --- |
| RS-<SCREEN>-<FEATURE>-01 | <One testable requirement.> |

## States and edge cases

- <Feature-specific loading, empty, error, disabled, or stale behavior.>

## Acceptance criteria

- <Observable pass condition.>
```

An RS file may contain multiple requirements for one feature. It must not group
separate features merely because they appear in the same visual panel.

## 5. Adding another screen or role

For a new `DEVICE-DETAIL` screen:

```text
requirements/DEVICE-DETAIL/
|-- SRS.md
|-- RS-01-DEVICE-OVERVIEW.md
|-- RS-02-LIVE-TELEMETRY.md
`-- RS-03-DEVICE-ACTIVITY.md
```

Create the identical tree under `requirements_vi/`. Add the screen and feature
groups to both FBS files. The SRS states the supported role or roles.

If an Operator and Administrator use the same screen with only permission
differences, keep one folder and specify role-dependent actions in SRS and the
affected RS files. If layout, workflow, or behavior differs materially, use
distinct screen folders such as `ADMIN-DEVICE-DETAIL/` and
`OPERATOR-DEVICE-DETAIL/`.
