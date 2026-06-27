---
id: FR-001
title: "Suite configuration API"
type: FR
relationships:
  - target: ix://agent-ix/cli-agent-evals/US-002
    type: implements
---

# [FR-001] Suite configuration API

## Description

The library SHALL expose a `defineSuite` API that accepts scenarios plus optional
workspace, prompt, environment, metric, and assertion adapters.

## Dependencies

- Depends on `@agent-ix/ix-cli-core` for CLI framework integration.
- No project-specific eval repository depends on this requirement before the
  shared package is built.

## Acceptance Criteria

| ID          | Criteria                                                     | Verification |
| ----------- | ------------------------------------------------------------ | ------------ |
| FR-001-AC-1 | `defineSuite` preserves the suite shape for runtime loading. | Unit         |
| FR-001-AC-2 | Suite selection supports canary, all, and filtered runs.     | Unit         |
