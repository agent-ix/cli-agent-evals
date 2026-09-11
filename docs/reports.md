# Reports

Reports are JSON files written to `evals/reports/latest.json` by default. New
reports use the closed `cli-agent-evals.report/v1` contract; consumers can
validate untrusted report JSON with the exported `parseEvalReport` decoder.

They include:

- suite, agent, model, repeat count
- per-scenario pass rate
- latency p50/p95
- token/tool metrics when available
- assertion checks and failures
- workdir and session id per sample
- lowercase SHA-256 transcript identity and an explicit `retained`,
  `not-retained`, or `unavailable` state

The default mode snapshots any observed transcript long enough to derive its
metrics and digest, then removes the scenario workspace. It reports
`not-retained` without a path, so a digest does not imply that evidence can be
reopened.

Use `--keep` as release-evidence mode. The report then names a portable path
relative to `workDir`; the bytes at that path produced `transcriptDigest` and
remain available for an external verifier. A verifier should resolve that path
beneath `workDir` and compare the SHA-256 before consuming the transcript.
Missing, unreadable, or uncapturable transcript bytes are reported as
`unavailable` with no digest or path.

Print a summary from an existing report:

```bash
cli-evals rebuild --report evals/reports/latest.json
```
