# RS-01 - Device inventory

| Field | Value |
| --- | --- |
| Screen | Device List |
| FBS | FBS-1.2, Device inventory |
| Priority | Must |

## Goal

Device inventory.

## Requirements

| ID | Requirement |
| --- | --- |
| RS-DEVLIST-INV-01 | Show each device once with ID, name, health, connection, per-record source, last seen and attention. |
| RS-DEVLIST-INV-02 | Present health online as Healthy, distinct from connection Online. Null last seen is Never seen. |
| RS-DEVLIST-INV-03 | Label manual records Manual input; gateway records with SIM-SDR- prefix Simulator; other gateway records SDR Gateway. |
| RS-DEVLIST-INV-04 | Support loading, empty fleet, unavailable/Retry and labeled stale state without fabricated data; render database strings as text. |

## States and edge cases

- Empty/unavailable data shall not enable invalid controls; stale data is visibly labeled.

## Acceptance criteria

- Verify the requirements above with empty and populated data, keyboard controls, and refresh failures.
