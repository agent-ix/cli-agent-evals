---
id: SR-007
title: "Code review — public npm release workflow and dependency re-resolution"
type: SpecReview
analysis: code-review
scope: "agent-ix/cli-agent-evals; .github/workflows/release.yml, bin/cli-evals.js, package.json, pnpm-lock.yaml (PR #22, head 3e293ba)"
review_set: base
---

## Summary

Ticket: none (no Linear ticket exists for this repository).

Reviewed `git diff origin/main...HEAD` for PR #22: a new `release.yml` thin
caller of the shared `nodejs-actions` release reusable, a lockfile re-resolved
against public npmjs, two dependency range rewrites in `package.json`, and a
lazy `import("../dist/cli.js")` in the bin launcher.

Compared `release.yml` with the `release.yml` on `main` of `ix-trace-ts` and
`agent-pty`, and with the reusable it calls. Checked the lockfile for private
registry tarballs (none remain), checked `@agent-ix/agent-pty@0.1.0` and
`@agent-ix/ix-cli-core@0.12.0` against public npmjs, and checked the
`agent-pty` session API used by `src/runner.ts` against `agent-pty` main.

## Verdict

**CHANGES REQUESTED** (one medium dependency defect, one medium workflow
deviation).

Clean: the lockfile has no `npm.ix` or `npm.pkg.github.com` tarball entries and
every root specifier matches `package.json`. The launcher change is correct: the
shebang and executable mode are unchanged, the module stays ESM with top-level
await, the `--version` path no longer needs `dist/`, and a missing `dist/` or a
rejected `main()` still exits 1 with the error printed, as before. The
`agent-pty` 0.1.7 to 0.1.0 move is a registry renumbering; the
`startSession`/`type`/`enter`/`capture`/`kill`/`sendKey` API used by the runner
is present. The workflow carries no secret value, only `secrets.NPM_TOKEN`, and
names no private repository.

## Findings

| ID      | Severity | Summary                                                                                                                                                                                                                                                                                        | Refs                                                           |
| ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| FND-001 | medium   | Lockfile now installs two `@oclif/core` majors: the root stays at 4.11.7 (used for `Flags`/`Args` in src/cli.ts) while ix-cli-core 0.12.0 takes 5.1.10 as a hard dependency for `BaseCommand`; every command mixes oclif 4 flag definitions into an oclif 5 parser, and no test runs a command | pnpm-lock.yaml:17-19; pnpm-lock.yaml:1688-1697; src/cli.ts:1-2 |
| FND-002 | medium   | `release.yml` triggers on `workflow_dispatch` only; the ix-trace-ts and agent-pty standard also triggers on `push: tags: ["*.*.*"]`, so a release tag publishes nothing                                                                                                                        | .github/workflows/release.yml:8-9                              |
| FND-003 | low      | Range rewrites to `^0.1.0` / `^0.12.0` pin the minor on 0.x and break from the file's `>=` convention; public resolution did not need them (`>=0.10.0` already resolves 0.12.0 on npmjs)                                                                                                       | package.json:51-52                                             |
| FND-004 | low      | PR title says "Trusted Publishing" but the workflow ships the token form; PR body still says it is blocked on agent-pty and an npm.ix lockfile, which this head resolves. The squash commit inherits the stale title                                                                           | PR #22 title/body                                              |

## Recommendations

- FND-001: re-resolve the root `@oclif/core` so one copy serves both (for
  example `pnpm update @oclif/core` to 5.x, then confirm the lockfile carries a
  single `@oclif/core` snapshot), and add a src-level test that calls `main()`
  for a flag-parsing command (`init`, or `list --suite <fixture>`). Separately,
  ix-cli-core 0.12.0 changed `@oclif/core` from a peer dependency to a hard
  dependency; a framework base class should stay a peer. That belongs to the
  ix-cli-core owner.
- FND-002: add `push: tags: ["*.*.*"]` as in agent-pty, unless dispatch-only is
  deliberate; if so, say why in the workflow comment.
- FND-003: keep `>=` with the raised floor, or state why the minor is pinned.
- FND-004: retitle (for example "ci: add npm release workflow (token first
  publish)") and drop the stale blocker paragraph before merge.
