---
name: sdr-requirements
description: Create and maintain bilingual FBS, screen-level SRS, and feature-level RS documentation for SDR Management. Use when planning, adding, changing, reviewing, or restructuring a screen, role, UI group, or feature under docs/requirements and docs/requirements_vi.
metadata:
  short-description: Maintain SDR requirements by screen
---

# SDR requirements workflow

Use this skill to keep the English and Vietnamese requirement sets structurally
identical and traceable while SDR Management grows across screens and
roles.

## Required structure

```text
docs/
|-- requirements/
|   |-- FBS.md
|   `-- <SCREEN-NAME>/
|       |-- SRS.md
|       |-- RS-01-<FEATURE-NAME>.md
|       `-- RS-02-<FEATURE-NAME>.md
`-- requirements_vi/
    |-- FBS.md
    `-- <SCREEN-NAME>/
        |-- SRS.md
        |-- RS-01-<FEATURE-NAME>.md
        `-- RS-02-<FEATURE-NAME>.md
```

- Use uppercase kebab case for screen folders and feature filenames.
- Each screen is a self-contained folder. Do not create root-level `SRS/` or
  `RS/` directories and do not create aggregate `SRS.md` or `RS.md` files.
- Keep one global `FBS.md` per language.
- Keep exactly one `SRS.md` in each screen folder.
- Keep one feature per numbered `RS-*.md` file. Never combine unrelated
  features into one RS file.

## Document responsibilities

- `FBS.md` is the product-wide feature hierarchy and screen inventory. Update
  it whenever a screen, UI group, or feature is added, removed, renamed, or
  changes status.
- `<SCREEN-NAME>/SRS.md` describes the whole screen: role, purpose,
  preconditions, screen requirements, states, data behavior, interactions,
  non-functional constraints, acceptance summary, and traceability to its RS
  files.
- `<SCREEN-NAME>/RS-XX-<FEATURE>.md` specifies exactly one feature: goal,
  priority, detailed requirements, edge states, and acceptance criteria.

Read [references/document-schema.md](references/document-schema.md) before
creating a new screen folder, splitting features, or substantially restructuring
existing requirements. It contains the required fields, naming rules, and
templates.

## Bilingual invariants

- English lives in `docs/requirements`; Vietnamese lives in
  `docs/requirements_vi`.
- Both trees must contain the same screen folders and filenames.
- Preserve requirement IDs, priorities, FBS references, status values, and
  technical meaning across languages.
- Translate explanatory text, not identifiers. Preserve product UI copy when
  the actual interface is English, such as `Online`, `Offline`, and
  `New reconfiguration`.
- Make the same structural or requirement change in both languages during the
  same task. Do not leave one version as a later follow-up.

## Requirement identifiers

- Screen requirement IDs use `SRS-<SCREEN-CODE>-NN`.
- Feature requirement IDs use `RS-<SCREEN-CODE>-<FEATURE-CODE>-NN`.
- Keep existing IDs stable. Do not renumber IDs because a requirement moved.
- Number RS filenames sequentially within their screen folder. Append the next
  unused file number for a new feature; do not reuse a removed feature number.
- Every SRS requirement row must reference its corresponding local RS filename.

## Workflow

1. Inspect the current English and Vietnamese FBS plus the affected screen
   folders before editing. Preserve valid existing IDs and user-authored scope.
2. Determine the affected screen, role, UI groups, individual features, design
   status, and Figma frame when available.
3. Update both FBS files if the feature hierarchy or delivery status changed.
4. Create or update the screen folder in both languages.
5. Update `SRS.md` at screen level. Keep implementation choices out unless they
   are genuine constraints or externally visible behavior.
6. Create or update one numbered RS file per feature. Split a file if it has
   accumulated multiple independently testable features.
7. Verify every visible UI group and action traces from FBS to SRS to an RS file.
8. Run the validator and resolve every reported mismatch:

```powershell
powershell -ExecutionPolicy Bypass -File ai-skills/sdr-requirements/scripts/validate_requirements.ps1
```

## Scope boundaries

- This skill edits requirement documentation; it does not implement application
  code or change the Figma design unless the user separately asks for that work.
- Do not invent product behavior merely to fill a template. Mark unresolved
  behavior explicitly when evidence is insufficient.
- When a new role reuses an unchanged screen, document the role difference in
  the existing screen SRS. Create a separate screen folder only when the screen
  behavior or UI is meaningfully different.
