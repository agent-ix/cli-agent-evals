---
name: cli-evals
description: Run, inspect, and debug cli-evals suites for live coding-agent CLI evaluations.
---

# CLI Evals

If this plugin is not initialized or an Agent IX command fails, read [the cli-agent-evals setup guide](https://github.com/agent-ix/cli-agent-evals/blob/main/setup.md) for its prerequisites and local diagnosis.

Use this skill when a user wants to run a live eval suite, compare agents, inspect
reports, rebuild metrics, or diagnose local prerequisites.

## Process

1. Run `cli-evals doctor` first when the target agent or auth state is unclear.
2. List scenarios with `cli-evals list --suite <config>`.
3. Run canaries before full corpora:
   `cli-evals run --suite <config> --canary --agent <agent> --model <model>`.
4. Use `--filter <EV-ID>` for a failing scenario and add `--keep` to preserve the
   workdir.
5. Rebuild summaries from existing reports with
   `cli-evals rebuild --report <evals/reports/latest.json>`.

Do not trigger `--all` live agent runs without the user explicitly asking; they
cost time, tokens, and may use authenticated agent sessions.
