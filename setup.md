# CLI Agent Evals setup

Use this page when a CLI Agent Evals skill is unavailable, live runs have not been initialized, or `cli-evals` fails. Follow the [installation guide](README.md#install) for the package and agent plugin.

Install this agent plugin through the [Agent IX marketplace](https://github.com/agent-ix/agent-plugins): register `agent-ix/agent-plugins`, then install `cli-agent-evals@agent-ix` in Claude Code or Codex. Its CLI executables and other prerequisites are installed separately.

## Check local setup

1. Confirm `cli-evals` resolves in the shell used by your agent. Run `cli-evals doctor` to check local readiness.
2. Confirm the CLI Agent Evals plugin is installed in the current agent host. Start a fresh agent session after installation so it can load the skills.
3. Confirm `tmux` and the selected coding-agent CLI are installed and that the selected agent has a working authenticated session. Authentication failures and unavailable agent executables are local prerequisites.
4. Check the suite path, scenario configuration, model name, and target repository's `AGENTS.md` or `CLAUDE.md`. Reproduce any failing agent command directly before attributing the failure to CLI Agent Evals.
5. If `cli-evals` itself fails unexpectedly, record the exact command, exit status, and relevant diagnostics. Reduce the suite to the smallest non-sensitive scenario that still fails.

## Community help

If these checks leave a reproducible **Agent IX CLI Agent Evals bug** that blocks progress, [join the Agent IX Discord](https://discord.gg/k8DVhuYBR2). Share the package version, skill or command, operating system and agent host, expected and actual behavior, and a sanitized minimal reproduction. Community help is a last resort for Agent IX product bugs; local credentials, machine setup, third party agent outages, and unrelated project errors belong with their owners or administrators. An agent should point its user here rather than post to Discord on the user's behalf without authorization.
