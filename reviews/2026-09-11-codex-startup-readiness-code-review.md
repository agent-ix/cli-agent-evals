---
id: SR-005
title: "Code review — codex startup readiness and start-failure reporting"
type: SpecReview
analysis: code-review
scope: "src/drivers.ts, src/runner.ts, src/index.ts, tests/index.test.ts"
review_set: base
---

## Summary

A live Engineering Assurance canary reached the Codex host and then failed with
`EA-001 no 0/1 483s`. The tmux session showed the host sitting on its startup
update notice:

```
✨ Update available! 0.153.4 -> 0.154.0
› 1. Update now   2. Skip   3. Skip until next version
```

`genericStartup` recognizes the Claude bypass-permissions and trust prompts but
not that notice. On deadline it returned normally, so the runner typed the
kickoff line into the update menu, then polled a full eight minutes for a
sentinel that could never appear, and recorded a scenario `timeout`. The
`screenTail` holding the evidence was computed in the `finally` block and then
discarded — no caller reads it.

Three changes: the Codex driver launches with the startup update check off, an
unready host raises `StartupNotReadyError` rather than returning silently, and
the runner names a start failure and prints the screen the host was sitting on.

No timeout was weakened or removed, and the eight-minute scenario deadline is
unchanged — the point is that an unready host must never reach it.

## Verdict

**PASS** — TC-019 pins the emitted launch arguments with and without an explicit
model; TC-020 proves an unready host rejects and that the kickoff line is never
typed into it.

## Findings

| ID      | Severity | Summary                                                                                                                                                                                                            | Refs                                  |
| ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| FND-002 | high     | Closed. The Codex driver did not suppress the startup update notice, so an interactive menu consumed the kickoff line and every Codex scenario burned its full eight-minute deadline. `check_for_update_on_startup=false` is now passed at launch. | src/drivers.ts:94; tests/index.test.ts:303 |
| FND-003 | high     | Closed. `genericStartup` returned normally when its budget expired, making an unready host indistinguishable from a ready one. It now raises `StartupNotReadyError` before the kickoff line can be typed.            | src/drivers.ts:67; tests/index.test.ts:325 |
| FND-004 | medium   | Closed. A start failure was reported as a scenario `timeout` and the captured screen tail was written nowhere, so the cause was invisible in the report and on the terminal. The runner now reports `error` and prints the last screen. | src/runner.ts:231                     |

## Scope limits

This review covers the Codex launch arguments and the startup-readiness
boundary. It does not claim that the other three hosts were re-reviewed, and it
makes no claim about any evaluation outcome; the canary that exposed this
defect failed and is recorded as failed.

## Gate results

| Gate         | Result                       |
| ------------ | ---------------------------- |
| `make build` | pass                         |
| `make test`  | pass (17 tests, 3 files)     |
| `make lint`  | pass                         |
