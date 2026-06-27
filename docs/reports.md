# Reports

Reports are JSON files written to `evals/reports/latest.json` by default.

They include:

- suite, agent, model, repeat count
- per-scenario pass rate
- latency p50/p95
- token/tool metrics when available
- assertion checks and failures
- workdir, session id, and transcript path per sample

Print a summary from an existing report:

```bash
cli-evals rebuild --report evals/reports/latest.json
```
