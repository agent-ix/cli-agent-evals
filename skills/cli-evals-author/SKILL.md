---
name: cli-evals-author
description: Draft cli-evals scenarios, suite configs, assertions, fixtures, and metric classifiers.
---

# CLI Evals Author

Use this skill when adding or changing eval coverage for a CLI project.

## Scenario Authoring

1. Identify the user workflow being measured and assign a stable `EV-XXX` id.
2. Keep prompts task-focused and require the success sentinel only at the end.
3. Put project-specific setup in `setup(ctx)` and keep generic runner behavior in
   `@agent-ix/cli-agent-evals`.
4. Assert success independently from the agent's self-report: inspect generated
   files, command output, persisted state, or validation commands.
5. Mark only cheap, representative scenarios as `canary: true`.
6. Prefer deterministic suites for non-agent CLIs such as Rust benchmark or unit
   test checks.

## Output

Produce or update `cli-agent-evals.config.ts`, scenario fixtures, assertion code,
and README usage examples together so the suite remains runnable by humans and
agents.
