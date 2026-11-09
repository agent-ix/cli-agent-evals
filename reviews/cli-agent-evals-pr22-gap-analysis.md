---
id: SR-008
title: "Gap analysis — launcher lazy import and CLI command coverage"
type: SpecReview
analysis: gap-analysis
scope: "agent-ix/cli-agent-evals; bin/cli-evals.js, src/cli.ts, tests/index.test.ts (PR #22, head 3e293ba)"
review_set: base
---

## Summary

Ticket: none (no Linear ticket exists for this repository).

Plan completion: not assessed. Traced the one production-code change in the
PR, the launcher's lazy `import("../dist/cli.js")`, to its requirement and test.
FR-005-AC-4 ("Invoking the runner with `--version` succeeds without a suite or
provider and returns only its non-empty package version on standard output")
is bound to TC-018, which spawns `bin/cli-evals.js --version` and checks exit
status, exact stdout and empty stderr. The binding is correct, and the change
strengthens it: TC-018 no longer depends on a prior build.

## Verdict

**PASS WITH GAP**: FR-005-AC-4 is covered. The command path that the
lockfile change affects has no test.

## Findings

| ID      | Severity | Summary                                                                                                                                                                                                  | Refs                                    |
| ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| FND-001 | medium   | No test runs `main()` or any command in src/cli.ts, so flag parsing and command dispatch are untested; this PR moves `BaseCommand` onto oclif 5 (see SR-007 FND-001) and the suite cannot detect a break | src/cli.ts:191-210; tests/index.test.ts |

## Recommendations

Add one src-level test (it must not need `dist/`, because the release reusable
runs `make test` before `make build`) that calls `main(["init"])` and a
flag-taking command such as `list --suite <fixture>`, asserting output and
exit behaviour.

## Dispositions

Round 1, verified against `git diff 3e293ba..6b30682`.

| FND     | Outcome | Reason                                                                                                                                                                                                                                                                         |
| ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FND-001 | fixed   | New `tests/cli.test.ts` imports `main` from `../src/cli.js` (no `dist/` needed), asserts `init` prints the template, and asserts `list --suite <tmp fixture>` lists its scenario; the list test fails if `--suite` is not parsed, since the default config path does not exist |
