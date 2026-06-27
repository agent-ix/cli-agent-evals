# Suite Authoring

A suite is an ESM module exporting `defineSuite({...})`.

Each scenario should include:

- `id`: stable `EV-XXX` identifier.
- `canary`: true for cheap representative scenarios.
- `prompt`: task text handed to the agent in `EVAL_TASK.md`.
- `setup(ctx)`: optional fixture preparation.
- `expect`: project-specific assertion data.

Suites should assert success independently from the agent's self-report. Use
files, CLI status commands, validation commands, and persisted state.

For non-agent checks, set `mode: "deterministic"` and provide a command:

```ts
{
  id: "BENCH-001",
  mode: "deterministic",
  deterministic: {
    command: "cargo",
    args: ["test"],
  },
}
```
