# Agent Drivers

Built-in drivers:

- `claude`
- `codex`
- `opencode`
- `copilot`

All live drivers use `agent-pty` and a real terminal session. Claude includes a
native JSONL transcript parser for token and tool metrics. Other drivers report
success, latency, sentinels, and workdir details unless a suite supplies native
metrics.

Run readiness checks with:

```bash
cli-evals doctor
```
