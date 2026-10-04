# CLI Agent Evals

[![Discord](https://img.shields.io/badge/Discord-Join%20us-5865F2?logo=discord&logoColor=white)](https://discord.gg/k8DVhuYBR2) [![IX Skills](https://github.com/agent-ix/agent-plugins/raw/refs/heads/main/assets/ix-skills.svg)](https://github.com/agent-ix/agent-plugins)

Unified live eval toolkit for coding-agent CLIs.

`cli-evals` runs the same scenario suite across Claude Code, OpenAI Codex,
opencode, and GitHub Copilot by driving real interactive CLIs through
`@agent-ix/agent-pty`.

## Setup

If this plugin is uninitialized or a command fails, follow the [plugin setup guide](setup.md) for its required CLIs, configuration, and local diagnosis.

## Community help

If the setup checks leave a reproducible Agent IX cli-agent-evals bug that blocks progress, [join the Agent IX Discord](https://discord.gg/k8DVhuYBR2). Community help is a last resort for Agent IX product bugs, not a help desk for local credentials, machine setup, third party tools, or unrelated projects. See [setup.md](setup.md#community-help) for what to include.

## Install

```bash
pnpm add -D @agent-ix/cli-agent-evals
```

Or install globally:

```bash
npm install -g @agent-ix/cli-agent-evals
```

Prerequisites for live runs:

- `tmux` >= 3.0
- `claude`, `codex`, `opencode`, or Copilot/`gh` on `PATH`
- authenticated local agent sessions for the agents you run

Check local readiness:

```bash
cli-evals doctor
```

## Quickstart

Create `cli-agent-evals.config.mjs`:

```ts
import { defineSuite } from "@agent-ix/cli-agent-evals";

export default defineSuite({
  name: "my-cli",
  rootDir: import.meta.dirname,
  scenarios: [
    {
      id: "EV-001",
      canary: true,
      prompt:
        "Use my CLI to complete the happy path, then print the success sentinel.",
    },
  ],
});
```

Run canaries:

```bash
cli-evals run --suite ./cli-agent-evals.config.mjs --canary --agent claude --model sonnet
```

Run one scenario in release-evidence mode, retaining its workdir and captured
transcript:

```bash
cli-evals run --suite ./cli-agent-evals.config.mjs --filter EV-001 --agent codex --model gpt-5 --keep
```

Print a previous report:

```bash
cli-evals rebuild --report evals/reports/latest.json
```

## Plugin Install

Claude Code:

```bash
claude plugin marketplace add agent-ix/agent-plugins
claude plugin install cli-agent-evals@agent-ix
```

Codex:

```bash
codex plugin marketplace add agent-ix/agent-plugins
codex plugin add cli-agent-evals@agent-ix
```

opencode:

```bash
gh skill install agent-ix/cli-agent-evals --all --scope user --agent opencode
```

GitHub Copilot:

```bash
gh skill install agent-ix/cli-agent-evals --all --scope user --agent github-copilot
```

Installed skills:

- `cli-evals`: run, inspect, and debug suites.
- `cli-evals-author`: draft scenarios, fixtures, assertions, and classifiers.

## Docs

- [Usage](docs/usage.md)
- [Suite authoring](docs/suite-authoring.md)
- [Agent drivers](docs/agent-drivers.md)
- [Reports](docs/reports.md)
- [Plugin install](docs/plugin-install.md)
