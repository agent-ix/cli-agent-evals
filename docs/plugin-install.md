# Plugin Install

The package ships agent skills and manifests for Claude Code, Codex, opencode,
and GitHub Copilot.

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

The standalone `agent-ix/cli-agent-evals` marketplace remains available for
existing installations. Use the [migration guide](https://github.com/agent-ix/agent-plugins/blob/main/docs/migration.md)
when switching an existing plugin to the shared public marketplace. The plugin
does not install the `cli-evals` executable or authenticate agent sessions.
