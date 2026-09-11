---
id: FR-004
title: "Versioned retained evaluation reports"
type: FR
relationships:
  - target: "ix://agent-ix/cli-agent-evals/US-001"
    type: "implements"
---

# FR-004: Versioned retained evaluation reports

## Description

cli-agent-evals SHALL expose one versioned report contract that records whether
each scenario transcript was unavailable, observed but not retained, or copied
into the retained run workspace. The contract SHALL let an external consumer
verify retained transcript identity without reimplementing agent-host execution.

## Inputs

- The completed scenario context, including `workDir`, `sessionId`, and the
  optional transcript source path supplied by its agent driver.
- The run's explicit `keep` option.
- Existing scenario result, assertion, and metrics observations.

## Outputs

- An `EvalReport` carrying `reportVersion: cli-agent-evals.report/v1`.
- For every scenario sample, `transcriptDigest` as a lowercase SHA-256 identity
  or `null`, `transcriptRetention` as `retained`, `not-retained`, or
  `unavailable`, and `transcriptPath` only for a retained copy.
- An exported strict decoder for the versioned report contract.

## Behavior

- When a scenario host terminates, cli-agent-evals SHALL snapshot each
  available transcript into the scenario work directory before assertion
  reporting or workspace cleanup.
- cli-agent-evals SHALL derive transcript metrics, lowercase SHA-256 identity,
  and any retained evidence from the same snapshotted bytes.
- When `keep` is false and transcript bytes were observed, cli-agent-evals SHALL
  report `not-retained` with the snapshot digest and no `transcriptPath`, then
  remove the scenario workspace through its existing cleanup boundary.
- When `keep` is false and no transcript bytes were observed, cli-agent-evals SHALL report `unavailable`, a null digest, and no transcript path.
- When `keep` is true and transcript bytes were observed, cli-agent-evals SHALL
  preserve the workspace and report `retained`, the snapshot digest, and a safe
  path relative to `workDir` whose bytes produce that digest.
- When `keep` is true and no transcript bytes were observed, cli-agent-evals SHALL preserve the workspace but report `unavailable`, a null digest, and no transcript path.
- The CLI SHALL describe `--keep` as the release-evidence mode; an existing
  workspace without the reported matching transcript copy is not retained
  transcript evidence.
- The package SHALL export a decoder that accepts only the complete v1 report
  shape.
- The package SHALL NOT open or evaluate a transcript during report decoding. A consumer detects later
  mutation or deletion by resolving the reported relative path under `workDir`
  and comparing those bytes with `transcriptDigest`.

## Error Conditions

- The decoder SHALL reject an unknown `reportVersion`.
- The decoder SHALL reject unknown report, result, or sample fields.
- The decoder SHALL reject an absolute, parent-traversing, empty-segment,
  backslash-containing, or control-character transcript path.
- The decoder SHALL reject a non-lowercase or non-64-hex-character digest.
- The decoder SHALL reject every retention/path/digest combination other than
  the three output shapes defined above.
- If a declared transcript cannot be read or its snapshot cannot be written,
  then cli-agent-evals SHALL report the transcript as unavailable.
- If transcript capture is unavailable, then cli-agent-evals SHALL NOT emit a
  digest or path for it.

## Constraints

| ID           | Constraint                                                                                                          | Type           | Validation          |
| ------------ | ------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------- |
| FR-004-CON-1 | cli-agent-evals SHALL NOT encode Engineering Assurance scenario semantics, aggregation decisions, or release policy | Responsibility | Inspection (TC-014) |
| FR-004-CON-2 | A reported transcript path SHALL be a safe relative path beneath its sample's `workDir`                             | Security       | Test (TC-012)       |
| FR-004-CON-3 | Digest and metric observations SHALL originate from the same immutable scenario snapshot bytes                      | Integrity      | Test (TC-010)       |

## Acceptance Criteria

| ID          | Criteria                                                                                                                                                | Verification        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| FR-004-AC-1 | Default cleanup reports observed transcript identity as not retained, exposes no reopenable path, and removes the workspace                             | Test (TC-009)       |
| FR-004-AC-2 | `--keep` produces a versioned report whose safe relative path, lowercase digest, retained state, and metrics match the copied bytes                     | Test (TC-010)       |
| FR-004-AC-3 | A consumer detects mutation or deletion using only `workDir`, retained `transcriptPath`, and `transcriptDigest`                                         | Test (TC-011)       |
| FR-004-AC-4 | The strict decoder rejects unknown versions, malformed identities, unsafe paths, contradictory retention, and unknown fields                            | Test (TC-012)       |
| FR-004-AC-5 | Existing report metrics, scenario outcomes, aggregation, and cleanup behavior remain unchanged outside the explicit transcript-retention contract       | Test (TC-003)       |
| FR-004-AC-6 | The first release carrying the v1 decoder names one exact package version, source revision, and public-registry artifact integrity for consumers to pin | Inspection (TC-013) |

## Dependencies

- **Upstream**: [FR-002](./FR-002-live-agent-runner-cli.md) live-agent runner
  and report generation.
- **Downstream**: `ix://agent-ix/engineering-assurance/FR-017` / TC-109 host
  integration.
