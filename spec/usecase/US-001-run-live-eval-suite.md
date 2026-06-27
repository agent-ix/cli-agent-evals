---
id: US-001
title: "Run a live eval suite"
type: US
relationships:
  - target: ix://agent-ix/cli-agent-evals/FR-002
    type: traces_to
---

# [US-001] Run a live eval suite

## Story

As a maintainer, I want to run canary, full, or filtered eval scenarios against a
real coding-agent CLI so that agent-facing workflows are measured end to end.

## Acceptance Criteria

| ID          | Criteria                                                                    | Verification |
| ----------- | --------------------------------------------------------------------------- | ------------ |
| US-001-AC-1 | A maintainer can run canary, all, or filtered scenarios.                    | Test         |
| US-001-AC-2 | A run records a JSON report with pass/fail, latency, and available metrics. | Test         |
