---
id: SR-010
title: "Base spec review of QSL-3008 PR #25"
type: SpecReview
analysis: base
scope: "agent-ix/cli-agent-evals; spec/functional/FR-002-live-agent-runner-cli.md; spec/tests.md"
review_set: base
---
## Scope

- `FR-002` (context only): The `cli-evals` command SHALL run suite scenarios through configured real agent drivers using `agent-pty`, sentinel detection, and report aggregation.
- `FR-002-AC-1` (examined): `cli-evals run` requires an explicit selector and agent.
- `FR-002-AC-2` (examined): `cli-evals doctor` probes real local agent binaries.
- `FR-002-AC-3` (examined): `cli-evals rebuild` prints summaries from existing reports.
- `FR-002-AC-4` (examined): A driver launches its agent host with every startup notice, update check, and first-run prompt that could consume the kickoff line suppressed or answered.
- `FR-002-AC-5` (examined): A host that does not reach a ready prompt within the startup budget is reported as a start failure with its last screen, never as a scenario timeout.
- `FR-002-AC-6` (examined): Startup prompt decisions are made on the live screen; a prompt already dismissed but still in scrollback neither blocks readiness nor is answered again.
- `FR-002-AC-7` (examined): A host is ready only when it can accept a submitted line; a composer drawn while the host is still initialising is not readiness.
- `FR-002-AC-8` (examined): The kickoff line is submitted outside any host paste-burst window, so the submit is never absorbed as a newline and the line is never left unsent in the composer.
- `FR-002-AC-9` (examined): A host whose transcript is written during the session has it located after the session ends, by the transcript's own record of the scenario working directory rather than by modification time, and its usage and operation counts are reported instead of `unavailable`.
- `FR-002-AC-10` (examined): A live run reports `exitReason: complete` only when the agent's prescribed final shell command `echo '<<<EVAL-COMPLETE>>>'` succeeds and its own result contains the marker. In fixtures where marker text appears in task instructions, assistant prose, a tool input, another command's result, or host/session `complete` status while an agent request remains pending, `exitReason` is not `complete`; a successful prescribed final command yields `complete`.
- `TM-001` (examined): Rows map FR-002 AC-1 through AC-9; AC-9 maps to TC-024 and TC-025. No row or case for AC-10 appears before FR-004.

## Summary
AC-10 precisely defines a successful prescribed final command whose own result contains the marker, and rejects several false-positive sources. The new criterion has no corresponding test case or TM-001 row, leaving its verification untraceable.

## Findings

| ID | Severity | Summary | Refs | Escape Cause |
| --- | --- | --- | --- | --- |
| FND-001 | medium | FR-002-AC-10 has no test case or TM-001 row; add a focused transcript fixture case and map the criterion in the matrix. | spec/functional/FR-002-live-agent-runner-cli.md:35; spec/tests.md:24-25 | correct-requirement-no-evidence |
