# Plugin Install

The package ships agent skills and manifests for Claude Code, Codex, opencode,
and GitHub Copilot.

Claude Code:

```bash
claude plugin marketplace add agent-ix/cli-agent-evals
claude plugin install cli-agent-evals
```

Codex:

```bash
codex plugin marketplace add agent-ix/cli-agent-evals
codex plugin add cli-agent-evals
```

opencode:

```bash
gh skill install agent-ix/cli-agent-evals --all --scope user --agent opencode
```

GitHub Copilot:

```bash
gh skill install agent-ix/cli-agent-evals --all --scope user --agent github-copilot
```
