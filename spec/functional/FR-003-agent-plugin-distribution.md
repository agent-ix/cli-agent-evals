---
id: FR-003
title: "Agent plugin distribution"
type: FR
relationships:
  - target: ix://agent-ix/cli-agent-evals/US-002
    type: implements
---

# [FR-003] Agent plugin distribution

## Description

The package SHALL include agent skills and plugin manifests for Claude Code,
Codex, opencode, and GitHub Copilot.

## Dependencies

- Depends on FR-001 so the skills can teach suite authoring against the shared API.
- Depends on FR-002 so the skills can teach running and debugging `cli-evals`.

## Acceptance Criteria

| ID          | Criteria                                                         | Verification |
| ----------- | ---------------------------------------------------------------- | ------------ |
| FR-003-AC-1 | The package ships `cli-evals` and `cli-evals-author` skills.     | Inspection   |
| FR-003-AC-2 | The package ships Claude, Codex, and `.agents` plugin manifests. | Inspection   |
