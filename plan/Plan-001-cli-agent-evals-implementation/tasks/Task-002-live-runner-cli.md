---
id: Task-002
title: "Live runner CLI"
type: Task
status: done
track: A
priority: P0
relationships:
  - target: ix://agent-ix/cli-agent-evals/Task-001
    type: depends_on
  - target: ix://agent-ix/cli-agent-evals/FR-002
    type: references
  - target: ix://agent-ix/cli-agent-evals/TC-002
    type: verifies
  - target: ix://agent-ix/cli-agent-evals/TC-003
    type: verifies
  - target: ix://agent-ix/cli-agent-evals/TC-004
    type: verifies
  - target: ix://agent-ix/cli-agent-evals/TC-007
    type: verifies
---

# Task-002: Live runner CLI

## Scope

Implement `cli-evals` command routing, live agent driver orchestration, deterministic command scenarios, sentinel handling, metrics parsing, and report aggregation.

## Subtasks

- [x] Add `cli-evals list`, `run`, `rebuild`, `doctor`, and `init`.
- [x] Add built-in drivers for Claude, Codex, opencode, and Copilot.
- [x] Add Claude transcript parsing and nullable metrics for other agents.
- [x] Add deterministic scenario execution and report writing.

## Deliverables

- `src/cli.ts`
- `src/runner.ts`
- `src/drivers.ts`
- `src/metrics.ts`
- `src/report.ts`
- `bin/cli-evals.js`

## Notes

- The `/code-review` pass fixed non-Claude screen sentinel detection and Copilot launch behavior.
