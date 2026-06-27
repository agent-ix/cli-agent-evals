---
id: IT-001
title: "Converted ix-flow and quoin suites"
type: IT
---

# [IT-001] Converted ix-flow and quoin suites

## Objective

`ix-flow` and `quoin` SHALL define suites that import the shared library and run
through `cli-evals` rather than duplicated local eval runners.

## Target Integration

- `ix-flow/cli-agent-evals.config.mjs`
- `quoin/cli-agent-evals.config.mjs`
- `cli-evals list`
- `cli-evals rebuild`

## Preconditions

- `cli-agent-evals` has been built.
- Existing `ix-flow` and `quoin` eval reports are present for rebuild checks.

## Inputs

- Suite config path.
- Existing report path.
- Scenario selector for live runs.

## Test Procedure

1. Run `cli-evals list` for the `ix-flow` suite config.
2. Run `cli-evals list` for the `quoin` suite config.
3. Run `cli-evals rebuild` for each existing report.
4. Run live scenarios only after explicit external model data-transfer approval.

## Expected Results

- Both suite configs load and list scenarios.
- Both report rebuild commands print summaries.
- Live runs produce reports when approval and agent auth are available.

## Acceptance Criteria

| ID          | Criteria                                                          | Verification |
| ----------- | ----------------------------------------------------------------- | ------------ |
| IT-001-AC-1 | `ix-flow/cli-agent-evals.config.mjs` loads with `cli-evals list`. | Integration  |
| IT-001-AC-2 | `quoin/cli-agent-evals.config.mjs` loads with `cli-evals list`.   | Integration  |
| IT-001-AC-3 | Existing report summaries rebuild through `cli-evals rebuild`.    | Integration  |
