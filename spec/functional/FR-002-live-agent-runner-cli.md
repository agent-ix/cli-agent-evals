---
id: FR-002
title: "Live agent runner CLI"
type: FR
relationships:
  - target: ix://agent-ix/cli-agent-evals/US-001
    type: implements
---

# [FR-002] Live agent runner CLI

## Description

The `cli-evals` command SHALL run suite scenarios through configured real agent
drivers using `agent-pty`, sentinel detection, and report aggregation.

## Dependencies

- Depends on FR-001 for suite configuration loading.
- Depends on `@agent-ix/agent-pty` for terminal session orchestration.

## Acceptance Criteria

| ID          | Criteria                                                    | Verification |
| ----------- | ----------------------------------------------------------- | ------------ |
| FR-002-AC-1 | `cli-evals run` requires an explicit selector and agent.    | Unit         |
| FR-002-AC-2 | `cli-evals doctor` probes real local agent binaries.        | Integration  |
| FR-002-AC-3 | `cli-evals rebuild` prints summaries from existing reports. | Integration  |
| FR-002-AC-4 | A live driver submits work only after its agent-specific ready state is observed. | Unit |
| FR-002-AC-5 | A startup timeout ends the run with an error without submitting work. | Unit |
| FR-002-AC-6 | A failed or timed-out live run retains its terminal tail and startup error in the JSON report. | Unit |
