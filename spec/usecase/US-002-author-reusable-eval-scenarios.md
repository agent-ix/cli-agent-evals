---
id: US-002
title: "Author reusable eval scenarios"
type: US
relationships:
  - target: ix://agent-ix/cli-agent-evals/FR-001
    type: traces_to
---

# [US-002] Author reusable eval scenarios

## Story

As a suite owner, I want to define scenarios, fixtures, assertions, and prompts
in my own repository so that I can rely on the shared runner for execution
mechanics without losing project-specific validation.

## Acceptance Criteria

| ID          | Criteria                                                                                             | Verification |
| ----------- | ---------------------------------------------------------------------------------------------------- | ------------ |
| US-002-AC-1 | A suite can declare scenarios in an ESM config module.                                               | Test         |
| US-002-AC-2 | A suite can provide project-specific workspace, prompt, environment, metric, and assertion adapters. | Test         |
