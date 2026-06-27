---
id: Plan-001
title: "CLI Agent Evals implementation"
type: Plan
status: active
relationships:
  - target: ix://agent-ix/cli-agent-evals/StR-001
    type: references
  - target: ix://agent-ix/cli-agent-evals/FR-001
    type: references
  - target: ix://agent-ix/cli-agent-evals/FR-002
    type: references
  - target: ix://agent-ix/cli-agent-evals/FR-003
    type: references
  - target: ix://agent-ix/cli-agent-evals/NFR-001
    type: references
---

# Implementation Plan: CLI Agent Evals implementation

## Requirements Summary

### Stakeholder Requirements

- [x] **StR-001**: Provide one shared toolkit for live CLI-agent evaluations.

### Functional Requirements

- [x] **FR-001**: Expose a reusable suite configuration API.
- [x] **FR-002**: Provide a live-agent runner CLI.
- [x] **FR-003**: Ship agent plugin distribution assets.

### Non-Functional Requirements

- [x] **NFR-001**: Validate using real installed agent binaries where approval allows.

## Dependency Graph

### Core dependency edges

- `FR-001 -> FR-002`
  Reason: the CLI runner loads and executes suite configs defined by the library API.
- `FR-001 -> FR-003`
  Reason: authoring skills and docs describe the same suite configuration API.
- `FR-002 -> NFR-001`
  Reason: real-agent validation exercises the runner and built-in drivers.

### Shared dependencies

- `agent-pty` session orchestration is shared by all live driver implementations.
- Report aggregation is shared by deterministic and live-agent scenarios.

### Cross-cutting constraints

- `NFR-001` applies to live validation commands and excludes fake-agent acceptance runs.

## Test Plan

### Unit Tests

- [x] **TC-001** (FR-001-AC-2): Verify selector parsing for canary, all, and filtered runs.
- [x] **TC-002** (US-001-AC-2): Verify Claude transcript metrics aggregate token/tool usage.
- [x] **TC-003** (US-001-AC-2): Verify deterministic scenarios write reports.

### Integration Tests

- [x] **TC-004** (FR-002-AC-2): Run `cli-evals doctor` against real local command probes.
- [x] **TC-005** (IT-001-AC-1): Load the `ix-flow` suite config with `cli-evals list`.
- [x] **TC-006** (IT-001-AC-2): Load the `quoin` suite config with `cli-evals list`.
- [x] **TC-007** (FR-002-AC-3, IT-001-AC-3): Rebuild summaries from existing reports.
- [ ] **TC-008** (NFR-001-AC-1): Execute a live external-agent scenario after explicit approval for external model data transfer.

## Remaining Work

### Remaining Dependency Graph

- `TC-008` depends on explicit user approval for sending local eval task/fixture content to the selected external model service.

### Track A: Completed implementation

#### A1: Shared library and CLI

- **Scope:** Implement suite definitions, selection, runner, metrics, report aggregation, and `cli-evals` commands.
- **Difficulty:** Medium
- **Exit criteria:** Build, lint, and unit tests pass.

#### A2: Plugin distribution

- **Scope:** Add Claude, Codex, opencode, and Copilot plugin manifests plus skills.
- **Difficulty:** Easy
- **Exit criteria:** Plugin assets are included in package metadata.

#### A3: Suite conversion

- **Scope:** Convert `ix-flow` and `quoin` to shared suite configs and Make targets.
- **Difficulty:** Medium
- **Exit criteria:** `cli-evals list` and `cli-evals rebuild` work for both repos.

### Track B: Approval-gated validation

#### B1: Real live eval execution

- **Scope:** Run `ix-flow` and `quoin` canaries through real agents.
- **Difficulty:** Medium
- **Exit criteria:** Live reports are produced after external model data-transfer approval.

## Parallel Execution Summary

```text
A1 -> A3 -> B1
A2 ----^
```

## Task File Mapping

| Task     | Track | Owned Requirements | Status |
| -------- | ----- | ------------------ | ------ |
| Task-001 | A     | FR-001             | done   |
| Task-002 | A     | FR-002             | done   |
| Task-003 | A     | FR-003             | done   |
| Task-004 | A     | StR-001, NFR-001   | done   |

## Coordination Rules

- Shared runner behavior lives in `cli-agent-evals`; project repositories own only suite-specific prompts, fixtures, shims, and assertions.
- Live external-agent runs require explicit approval when local workspace content would be sent to a model service.
