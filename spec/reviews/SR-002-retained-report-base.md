---
id: SR-002
title: "Base review — versioned retained reports"
type: SpecReview
analysis: base
scope: "Issue #6; FR-002; FR-004; TM-001"
review_set: base
relationships:
  - target: "ix://agent-ix/cli-agent-evals/FR-004"
    type: reviews
---

# Base review — versioned retained reports

## Summary

Reviewed the issue #6 report boundary, [FR-004](../functional/FR-004-versioned-retained-reports.md),
and its TC-003/TC-009..TC-013 matrix rows against the QUOIN base checklist. The
contract retains transcript bytes only in explicit `--keep` mode, binds metrics
and digest to one snapshot, makes default cleanup honest, and leaves
Engineering Assurance semantics outside cli-agent-evals.

## Verdict

**PASS** — the requirement is bounded, internally consistent, and executable
after resolving the findings below.

## Findings

| ID      | Severity | Summary                                                              | Refs            | Escape Cause        |
| ------- | -------- | -------------------------------------------------------------------- | --------------- | ------------------- |
| FND-001 | high     | Existing `--keep` does not retain transcripts stored outside workDir | FR-004 Behavior | missing-requirement |
| FND-002 | medium   | A digest alone could falsely imply bytes remained reopenable | FR-004-AC-1..3 | missing-requirement |
| FND-003 | medium   | Unknown versions and contradictory identity fields lacked an owner | FR-004-AC-4 | missing-requirement |
| FND-004 | high     | Metrics parsed from the mutable source path could describe different bytes from a later retained digest | FR-004-CON-3; FR-004-AC-2 | missing-requirement |
| FND-005 | medium   | The consumer had no exact released package identity for the new contract | FR-004-AC-6 | missing-requirement |

## Dispositions

- **FND-001 resolved**: retained mode copies the exact observed bytes into the
  work directory before cleanup and reports that copy by safe relative path.
- **FND-002 resolved**: `transcriptRetention` distinguishes retained,
  not-retained, and unavailable states; default mode exposes no path.
- **FND-003 resolved**: the package owns and exports a strict structural decoder
  while consumers own reopening and digest comparison.
- **FND-004 resolved**: one work-directory snapshot is the source for metrics,
  digest, and retained bytes.
- **FND-005 resolved**: TC-013 withholds completion until a public release names
  its exact package version, source revision, and artifact integrity.

## Boundary

This review covers report versioning and transcript retention only. It grants no
approval for live model execution, Engineering Assurance aggregation semantics,
or hosted CI.
