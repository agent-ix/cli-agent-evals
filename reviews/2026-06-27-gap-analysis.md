---
id: SR-003
title: "Gap analysis — cli-agent-evals implementation"
type: SpecReview
analysis: gap-analysis
scope: "spec/, src/, tests/, ix-flow/cli-agent-evals.config.mjs, quoin/cli-agent-evals.config.mjs"
review_set: subset
relationships:
  - { target: "ix://agent-ix/cli-agent-evals/SPEC-001", type: reviews }
  - { target: "ix://agent-ix/cli-agent-evals/TM-001", type: references }
---

# Gap Analysis — cli-agent-evals implementation

## Summary

Audited the implemented toolkit against its spec, Test Matrix, and
`Plan-001-cli-agent-evals-implementation` bundle. The plan tasks are complete and
the spec/plan/review artifacts validate. Live external-agent execution is no
longer blocked: `ix-flow` and `quoin` were both exercised through the converted
`cli-evals` path with real Claude Code runs.

## Verdict

**FAIL** — the live-agent acceptance path now has real evidence, but the
`ix-flow` canary corpus is not fully green (`EV-013` timed out at the HITL gate).

## Findings

| ID      | Severity | Summary                                                                                                                    | Refs            |
| ------- | -------- | -------------------------------------------------------------------------------------------------------------------------- | --------------- |
| FND-001 | high     | `ix-flow` live canary `EV-013` timed out at phase `staged`; the agent polled for an external HITL ack instead of acking it | TC-008, NFR-001 |
| FND-002 | medium   | Integration rows TC-004 through TC-007 are backed by executed command evidence, not durable tagged test cases in `tests/`  | TM-001, tests/  |

## Coverage

- Target plan: `plan/Plan-001-cli-agent-evals-implementation/`.
- Tasks done: 4 / 4.
- Matrix Test Cases backed by tagged test or live evidence: 4 / 8 (`TC-001`, `TC-002`, `TC-003`, `TC-008`).
- Command evidence observed: `cli-evals doctor`, `ix-flow` suite list/rebuild, `quoin` suite list/rebuild.
- Live evidence observed:
  - `ix-flow/evals/reports/cli-evals-live-canary-2026-06-27-rerun.json`: 4 / 5 canaries passed (`EV-001`, `EV-005`, `EV-011`, `EV-018`); `EV-013` failed after timeout.
  - `quoin/evals/reports/cli-evals-live-canary-2026-06-27.json`: 2 / 2 canaries passed (`EV-001`, `EV-008`).
- Untraced behaviors / stubs: 0 high-confidence source stubs found in `src/`.
- Semantic review: skipped; user requested `/gap-analysis` but did not explicitly opt into the optional semantic pass.
