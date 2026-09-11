---
id: StR-001
title: "Unified agent eval harness"
type: StR
---

# [StR-001] Unified agent eval harness

## Stakeholder Need

Agent IX maintainers need one shared toolkit for live CLI-agent evaluations so
`ix-flow`, `quoin`, and future CLIs do not maintain divergent harness code.

## Rationale

Duplicate eval harnesses drift in command-line behavior, report shape, metrics,
and agent-driver support. A shared toolkit centralizes runner mechanics while
leaving project-specific prompts, fixtures, and assertions in each owning repo.

## Validation Criteria

| ID           | Criteria                                                                        | Validation  |
| ------------ | ------------------------------------------------------------------------------- | ----------- |
| StR-001-VC-1 | The toolkit exposes a reusable library API and a `cli-evals` command.           | Test        |
| StR-001-VC-2 | Existing `ix-flow` and `quoin` eval suites can load through the shared library. | Integration |
