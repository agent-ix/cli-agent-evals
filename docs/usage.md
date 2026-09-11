# Usage

List scenarios:

```bash
cli-evals list --suite ./cli-agent-evals.config.mjs
```

Run canaries:

```bash
cli-evals run --suite ./cli-agent-evals.config.mjs --canary --agent claude --model sonnet
```

Run all scenarios:

```bash
cli-evals run --suite ./cli-agent-evals.config.mjs --all --agent claude --model sonnet --repeats 3
```

Run one scenario in release-evidence mode, retaining its workspace and captured
transcript:

```bash
cli-evals run --suite ./cli-agent-evals.config.mjs --filter EV-013 --agent claude --model sonnet --keep
```

Live runs are opt-in. Use `--canary` before `--all` because real agents consume
tokens, auth, and wall-clock time.
