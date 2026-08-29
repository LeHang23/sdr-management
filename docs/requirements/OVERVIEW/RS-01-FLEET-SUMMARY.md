# RS-01 - Fleet Summary

| Field | Value |
| --- | --- |
| Screen | Overview |
| FBS | FBS-1.1.1, Fleet summary |
| Priority | Must |

## Goal

Give the Administrator a fast numerical summary of the current fleet condition.

## Requirements

| ID | Requirement |
| --- | --- |
| RS-OVW-SUM-01 | The summary shall show Total devices, Online now, Needs attention, and Active jobs. |
| RS-OVW-SUM-02 | Values shall use the same latest successful Overview snapshot. |
| RS-OVW-SUM-03 | A missing value shall display an unavailable state instead of an incorrect zero. |
| RS-OVW-SUM-04 | Relevant summary cards shall link to their filtered detail lists when those screens are available. |

## Acceptance criteria

- Summary values match the simulated device and job dataset.
- Empty fleet data displays valid zero states without layout failure.
