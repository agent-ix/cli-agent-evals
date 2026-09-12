---
id: SR-006
title: "Code review — Codex rollout transcript discovery and metrics"
type: SpecReview
analysis: code-review
scope: "src/metrics.ts, src/drivers.ts, src/runner.ts, src/types.ts, tests/index.test.ts"
review_set: base
---

## Summary

Only the `claude` driver reported evaluation metrics. Every codex, opencode and
copilot cell recorded `metricStatus: unavailable`, `tokenUsage` all zeros,
`toolCalls: null` and `transcriptRetention: unavailable`, so three of the four
retained hosts carried no transcript bytes and no usage evidence at all.

This ports the Codex rollout work authored on `fix/codex-eval-readiness`
(`737dcd2`) onto current `main`. That branch forked at `dbfdbed`, before the
external-provider, retained-report, runner-identity, startup-readiness and
version commits, so three of its four commits duplicate what `main` already
carries and only the rollout-metrics commit adds anything. It is ported rather
than merged, and adapted to the merged driver API.

The one structural change `main` lacked is a `finalTranscriptPath` hook. Codex
writes its rollout _during_ the session, so the existing `transcriptPath` hook —
resolved before the host starts — cannot find it. The runner now re-resolves the
transcript once the session has ended.

Selection is by the rollout's own `session_meta.cwd` matching the scenario
working directory, not by modification time alone, because concurrent
evaluations share `~/.codex/sessions`.

## Verdict

**PASS** — TC-024 pins discovery against a synthetic sessions tree; TC-025 pins
usage, tool, and classification aggregation against a synthetic rollout.

## Findings

| ID      | Severity | Summary                                                                                                                                                                                        | Refs                               |
| ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| FND-008 | high     | Closed. Three of four hosts produced no metrics and no transcript, so most of a retained aggregate would carry no evidence. Codex now reports usage, tool calls and classified operations.     | src/metrics.ts:151; src/drivers.ts |
| FND-009 | medium   | Closed. `transcriptPath` is resolved before the host starts, which cannot work for a host that writes its transcript during the session. A `finalTranscriptPath` hook re-resolves it after.    | src/runner.ts; src/types.ts:116    |
| FND-010 | low      | Closed by construction. Selecting the newest rollout by mtime alone would mis-attribute a concurrent evaluation's transcript; selection requires `session_meta.cwd` to equal the scenario cwd. | src/drivers.ts                     |

## Scope limits

Covers Codex only. `opencode` and `copilot` still report `unavailable`, and this
review makes no claim about them, about any evaluation outcome, or about the
retained aggregate.

## Gate results

| Gate         | Result                   |
| ------------ | ------------------------ |
| `make build` | pass                     |
| `make test`  | pass (22 tests, 3 files) |
| `make lint`  | pass                     |
