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

| ID          | Criteria                                                                                                                                                   | Verification |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| FR-002-AC-1 | `cli-evals run` requires an explicit selector and agent.                                                                                                   | Unit         |
| FR-002-AC-2 | `cli-evals doctor` probes real local agent binaries.                                                                                                       | Integration  |
| FR-002-AC-3 | `cli-evals rebuild` prints summaries from existing reports.                                                                                                | Integration  |
| FR-002-AC-4 | A driver launches its agent host with every startup notice, update check, and first-run prompt that could consume the kickoff line suppressed or answered. | Unit         |
| FR-002-AC-5 | A host that does not reach a ready prompt within the startup budget is reported as a start failure with its last screen, never as a scenario timeout.      | Unit         |
| FR-002-AC-6 | Startup prompt decisions are made on the live screen; a prompt already dismissed but still in scrollback neither blocks readiness nor is answered again.   | Unit         |
| FR-002-AC-7 | A host is ready only when it can accept a submitted line; a composer drawn while the host is still initialising is not readiness.                          | Unit         |
