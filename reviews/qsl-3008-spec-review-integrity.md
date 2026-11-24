---
id: SR-011
title: "Integrity review of QSL-3008 PR #25"
type: SpecReview
analysis: integrity
scope: "agent-ix/cli-agent-evals; spec/functional/FR-002-live-agent-runner-cli.md"
review_set: subset
---
## Scope

- `FR-002-AC-10` (examined): A live run reports `exitReason: complete` only when the agent's prescribed final shell command `echo '<<<EVAL-COMPLETE>>>'` succeeds and its own result contains the marker. In fixtures where marker text appears in task instructions, assistant prose, a tool input, another command's result, or host/session `complete` status while an agent request remains pending, `exitReason` is not `complete`; a successful prescribed final command yields `complete`.

## Summary
AC-10 is a single observable completion rule with explicit acceptance and rejection conditions. The missing matrix mapping is recorded in the base review; no separate integrity defect was found.

## Findings

| ID | Severity | Summary | Refs |
| --- | --- | --- | --- |
| FND-001 | low | No findings (placeholder) | - |
