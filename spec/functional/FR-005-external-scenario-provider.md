---
id: FR-005
title: "External scenario provider protocol"
type: FR
relationships:
  - target: ix://agent-ix/cli-agent-evals/US-002
    type: implements
---

# [FR-005] External scenario provider protocol

## Description

`cli-agent-evals` SHALL support a configured external scenario provider so a
consumer can own scenario setup, prompts, and assertions without embedding
those semantics in a JavaScript suite module. The runner remains responsible
for selection, workspaces, real-agent execution, transcript retention,
metrics, and report construction.

## Inputs

- One provider executable and fixed argument vector from the loaded suite.
- One newline-delimited JSON request using
  `cli-agent-evals.external-provider-request/v1` for each `describe`,
  `prepare`, or `assert` operation.
- Runner-generated scenario context and the bounded agent-run observation.

## Outputs

- A newline-delimited JSON result using
  `cli-agent-evals.external-provider-result/v1`.
- A closed scenario catalogue from `describe`, one prompt/environment result
  from `prepare`, and one typed assertion result from `assert`.

## Behavior

- The runner SHALL invoke the provider directly, without a shell, with a
  bounded input, output, and timeout for every operation.
- The provider request SHALL contain `protocol`, `operation`, and `context`
  plus the operation-specific payload; an `assert` request carries the bounded
  agent-run observation. `protocol` is
  `cli-agent-evals.external-provider-request/v1`. The provider result SHALL
  contain exactly `protocol`, `operation`, and its operation-specific
  payload; `protocol` is
  `cli-agent-evals.external-provider-result/v1` and `operation` echoes the
  request. The context contains the runner-created scenario identifier,
  workspace path, working directory, session identifier, and report directory.
- A `describe` result SHALL contain only unique scenario identifiers and their
  optional `use_case`, `title`, and boolean `canary` selection metadata. The
  runner SHALL use that catalogue for selector handling and report identifiers.
- A `prepare` request SHALL identify one described scenario and its isolated
  workspace. Its result SHALL provide only a prompt and string environment
  entries; `prompt` is non-empty. The provider may create consumer-owned
  fixture files beneath that workspace.
- An `assert` request SHALL carry the selected scenario, context, and the
  completed agent-run observation (`ok`, exit reason, wall milliseconds,
  optional captured output, and optional exit code). Its result SHALL use the
  existing assertion-result shape (`ok`, optional `checks`, and optional
  `failures`).
- Unknown protocol revisions, operations, fields, malformed JSON, duplicate or
  undescribed scenarios, invalid environment values, malformed assertion
  results, unavailable providers, timed-out providers, and over-limit provider
  I/O SHALL fail the selected run without treating it as a passing assertion.
- The runner SHALL retain its existing in-process suite API. A provider is an
  alternative semantic source, not a second runner, report format, workspace
  system, agent driver, or transcript collector.
- The runner executable SHALL return its package version as one non-empty line
  for `--version` without loading a suite, contacting a host, or invoking a
  provider. A consumer that retains a provider evaluation MAY bind that exact
  executable/version pair as part of its governing identity.

## Acceptance Criteria

| ID          | Criteria                                                                                                                                                                                                          | Verification    |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| FR-005-AC-1 | A fixture provider can describe selected scenarios, prepare one isolated workspace, and return a typed assertion that appears unchanged in the normal report.                                                     | Unit (TC-015)   |
| FR-005-AC-2 | Wrong protocol, operation, response shape, duplicate scenario, invalid environment, nonzero exit, timeout, and over-limit request or response each produce a failed selected run with no false passing assertion. | Unit (TC-016)   |
| FR-005-AC-3 | The provider path does not invoke a shell or own agent processes, workspaces, transcript collection, metrics, selector parsing, or report serialization.                                                          | Static (TC-017) |
| FR-005-AC-4 | Invoking the runner with `--version` succeeds without a suite or provider and returns only its non-empty package version on standard output.                                                                      | Test (TC-018)   |

## Dependencies

- FR-001 supplies the suite configuration and selection API.
- FR-002 supplies agent execution and report aggregation.

## Constraints

- The protocol carries no consumer-specific scenario grammar.
- A provider is optional and does not change existing JavaScript suite behavior.
