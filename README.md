# CLI Agent Evals

[![Discord](https://img.shields.io/badge/Discord-Join%20us-5865F2?logo=discord&logoColor=white)](https://discord.gg/6qsdhSPE)
[![Agent IX Plugins](https://img.shields.io/badge/Agent%20IX-Plugins-0052CC)](https://github.com/agent-ix/agent-plugins)

Unified live eval toolkit for coding-agent CLIs.

`cli-evals` runs the same scenario suite across Claude Code, OpenAI Codex,
opencode, and GitHub Copilot by driving real interactive CLIs through
`@agent-ix/agent-pty`.

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
claude plugin install cli-agent-evals@agent-ix-public
```

Codex:

```bash
codex plugin marketplace add agent-ix/agent-plugins
codex plugin add cli-agent-evals@agent-ix-public
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

## Related Agent IX plugins

Browse the [Agent IX public marketplace](https://github.com/agent-ix/agent-plugins)
for independently installable Claude Code and Codex plugins:

- [Quoin](https://github.com/agent-ix/quoin) authors, reviews, and plans specifications.
- [Quire CLI](https://github.com/agent-ix/quire-cli) explores, writes, validates, links, and traces Markdown artifacts.
- [Engineering Assurance](https://github.com/agent-ix/engineering-assurance) prepares governed assurance decisions and evidence.
- [IX Flow](https://github.com/agent-ix/ix-flow) runs and authors resumable agent workflows.
- [CLI Agent Evals](https://github.com/agent-ix/cli-agent-evals) runs and authors coding-agent evaluation suites.

Plugin installation adds agent skills. Install each tool's CLI and any required
Quire modules separately, following its own installation instructions.
