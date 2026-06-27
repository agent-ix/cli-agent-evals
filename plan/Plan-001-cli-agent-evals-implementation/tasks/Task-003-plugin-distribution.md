---
id: Task-003
title: "Agent plugin distribution"
type: Task
status: done
track: A
priority: P1
relationships:
  - target: ix://agent-ix/cli-agent-evals/Task-001
    type: depends_on
  - target: ix://agent-ix/cli-agent-evals/FR-003
    type: references
  - target: ix://agent-ix/cli-agent-evals/TC-004
    type: verifies
---

# Task-003: Agent plugin distribution

## Scope

Ship installable agent plugin assets and skills for using and authoring eval suites.

## Subtasks

- [x] Add Claude plugin manifest and marketplace metadata.
- [x] Add Codex plugin manifest.
- [x] Add `.agents` marketplace metadata for opencode and GitHub Copilot installs.
- [x] Add `cli-evals` and `cli-evals-author` skills.
- [x] Add plugin installation documentation.

## Deliverables

- `.claude-plugin/`
- `.codex-plugin/`
- `.agents/plugins/marketplace.json`
- `skills/`
- `docs/plugin-install.md`

## Notes

- Package metadata includes plugin assets in `files`.
