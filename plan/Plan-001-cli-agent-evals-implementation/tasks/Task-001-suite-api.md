---
id: Task-001
title: "Suite configuration API"
type: Task
status: done
track: A
priority: P0
relationships:
  - target: ix://agent-ix/cli-agent-evals/FR-001
    type: references
  - target: ix://agent-ix/cli-agent-evals/TC-001
    type: verifies
---

# Task-001: Suite configuration API

## Scope

Implement the reusable suite model, scenario selection, suite loading, default workspace creation, and public TypeScript exports.

## Subtasks

- [x] Add `defineSuite`, `loadSuite`, and selector helpers.
- [x] Add public types for suites, scenarios, contexts, assertions, reports, and drivers.
- [x] Add unit tests for selector behavior.

## Deliverables

- `src/suite.ts`
- `src/types.ts`
- `src/workspace.ts`
- Public exports in `src/index.ts`

## Notes

- Verified by `TC-001`.
