---
id: Task-004
title: "Suite conversion and validation"
type: Task
status: done
track: A
priority: P0
relationships:
  - target: ix://agent-ix/cli-agent-evals/Task-002
    type: depends_on
  - target: ix://agent-ix/cli-agent-evals/StR-001
    type: references
  - target: ix://agent-ix/cli-agent-evals/NFR-001
    type: references
  - target: ix://agent-ix/cli-agent-evals/TC-005
    type: verifies
  - target: ix://agent-ix/cli-agent-evals/TC-006
    type: verifies
  - target: ix://agent-ix/cli-agent-evals/TC-007
    type: verifies
  - target: ix://agent-ix/cli-agent-evals/TC-008
    type: verifies
---

# Task-004: Suite conversion and validation

## Scope

Convert `ix-flow` and `quoin` to shared suite configs and document the integration setup while preserving project-specific prompts, fixtures, shims, metrics, and assertions.

## Subtasks

- [x] Add `ix-flow/cli-agent-evals.config.mjs`.
- [x] Add `quoin/cli-agent-evals.config.mjs`.
- [x] Update both Makefiles to invoke `cli-evals`.
- [x] Replace duplicated runner entrypoints with deprecation stubs.
- [x] Update both READMEs with setup and usage examples.
- [x] Verify list and rebuild commands for both converted suites.

## Deliverables

- `ix-flow/cli-agent-evals.config.mjs`
- `quoin/cli-agent-evals.config.mjs`
- Updated `ix-flow` and `quoin` Makefiles and READMEs

## Notes

- Live external-agent scenario execution is blocked until explicit approval acknowledges local eval content being sent to an external model service.
