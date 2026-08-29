# RS-02 - System Performance

| Field | Value |
| --- | --- |
| Screen | Overview |
| FBS | FBS-1.1.2, System performance |
| Priority | Must |

## Goal

Allow the Administrator to observe aggregate Throughput and SNR trends.

## Requirements

| ID | Requirement |
| --- | --- |
| RS-OVW-PERF-01 | The panel shall plot Throughput in Mbps and SNR in dB over time. |
| RS-OVW-PERF-02 | The chart shall clearly distinguish both metrics and their units. |
| RS-OVW-PERF-03 | The Administrator shall be able to select a supported time range. |
| RS-OVW-PERF-04 | Loading, empty, partial-data, and error states shall be displayed explicitly. |

## Acceptance criteria

- Both simulated metrics render with correct labels and units.
- Changing the time range refreshes only the required data.
