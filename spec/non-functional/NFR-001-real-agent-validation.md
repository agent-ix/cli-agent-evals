---
id: NFR-001
title: "Real-agent validation"
type: NFR
---

# [NFR-001] Real-agent validation

## Statement

Integration validation SHOULD use real installed agent binaries rather than fake
agent processes, because the toolkit exists to measure actual CLI-agent behavior.

## Measurement and Evaluation

| Metric                  | Target                            | Threshold                                  | Method             |
| ----------------------- | --------------------------------- | ------------------------------------------ | ------------------ |
| Driver probe coverage   | Real local command probes         | All configured driver probes report status | `cli-evals doctor` |
| Live scenario execution | Converted suite live-agent canary | At least one run after explicit approval   | Live eval run      |

## Verification

| ID           | Criteria                                                                               | Verification |
| ------------ | -------------------------------------------------------------------------------------- | ------------ |
| NFR-001-AC-1 | Live validation commands use `claude`, `codex`, `opencode`, or Copilot command probes. | Integration  |
| NFR-001-AC-2 | Fake agent binaries are limited to unit-level runner logic, not acceptance validation. | Review       |
