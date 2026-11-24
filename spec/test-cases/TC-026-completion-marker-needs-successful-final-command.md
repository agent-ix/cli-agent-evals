---
id: TC-026
title: "Completion marker needs a successful final command"
type: TC
relationships:
  - target: ix://agent-ix/cli-agent-evals/FR-002
    type: verifies
---
# TC-026: Completion marker needs a successful final command

## Description

Verify that a live run is marked complete only by the successful result of the
agent's prescribed final shell marker command, and that incidental marker text
does not complete a run.

## Test Procedure

For each fixture, start a live-runner session and record its transcript and
session result. Cover a marker appearing only in task instructions, assistant
prose, a tool input, another command's result, and a host/session completion
status while an agent request remains pending. In a separate fixture, execute
the prescribed final command `echo '<<<EVAL-COMPLETE>>>'` successfully and
record that command's result.

## Expected Results

The first five fixtures do not report `exitReason: complete`. Only the fixture
whose successful prescribed final command returns `<<<EVAL-COMPLETE>>>` reports
`exitReason: complete`.
