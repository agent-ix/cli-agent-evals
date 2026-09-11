import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  defineSuite,
  findSentinelInText,
  findSentinelInTranscript,
  parseEvalReport,
  parseClaudeMetrics,
  runSuite,
  selectScenarios,
} from "../src/index.js";

test("TC-001: selectScenarios requires exactly one selector", () => {
  const scenarios = [{ id: "EV-001", canary: true }, { id: "EV-002" }];
  expect(selectScenarios(scenarios, { canary: true }).map((s) => s.id)).toEqual(
    ["EV-001"],
  );
  expect(selectScenarios(scenarios, { all: true }).map((s) => s.id)).toEqual([
    "EV-001",
    "EV-002",
  ]);
  expect(
    selectScenarios(scenarios, { filter: "EV-002" }).map((s) => s.id),
  ).toEqual(["EV-002"]);
  expect(() => selectScenarios(scenarios, {})).toThrow(/select exactly one/);
});

test("findSentinelInText detects completion and failure markers", () => {
  expect(findSentinelInText("ok <<<EVAL-COMPLETE>>>")).toBe("complete");
  expect(findSentinelInText("bad <<<EVAL-FAILED>>>")).toBe("failed");
  expect(findSentinelInText("still running")).toBeNull();
});

test("findSentinelInTranscript ignores task brief echoes from Read results", () => {
  const dir = mkdtempSync(join(tmpdir(), "cli-evals-transcript-"));
  const transcript = join(dir, "session.jsonl");
  writeFileSync(
    transcript,
    [
      JSON.stringify({
        type: "assistant",
        message: {
          content: [
            {
              type: "tool_use",
              id: "read-task",
              name: "Read",
              input: { file_path: "EVAL_TASK.md" },
            },
          ],
        },
      }),
      JSON.stringify({
        type: "user",
        message: {
          content: [
            {
              type: "tool_result",
              tool_use_id: "read-task",
              content: "On success: echo '<<<EVAL-COMPLETE>>>'",
            },
          ],
        },
      }),
    ].join("\n"),
  );
  expect(findSentinelInTranscript(transcript)).toBeNull();

  writeFileSync(
    transcript,
    `${readFileSync(transcript, "utf8")}\n${JSON.stringify({
      type: "assistant",
      message: {
        content: [
          {
            type: "tool_use",
            id: "bash-marker",
            name: "Bash",
            input: { command: "echo '<<<EVAL-COMPLETE>>>'" },
          },
        ],
      },
    })}\n`,
  );
  expect(findSentinelInTranscript(transcript)).toBe("complete");
});

test("TC-002: parseClaudeMetrics aggregates token and tool usage", () => {
  const dir = mkdtempSync(join(tmpdir(), "cli-evals-metrics-"));
  const transcript = join(dir, "session.jsonl");
  writeFileSync(
    transcript,
    [
      JSON.stringify({
        type: "assistant",
        timestamp: "2026-01-01T00:00:00.000Z",
        message: {
          usage: {
            input_tokens: 10,
            output_tokens: 5,
            cache_creation_input_tokens: 2,
            cache_read_input_tokens: 3,
          },
          content: [
            { type: "tool_use", name: "Bash" },
            { type: "tool_use", name: "Write" },
          ],
        },
      }),
      JSON.stringify({
        type: "assistant",
        timestamp: "2026-01-01T00:00:05.000Z",
        message: { usage: { input_tokens: 1, output_tokens: 1 }, content: [] },
      }),
    ].join("\n"),
  );
  const metrics = parseClaudeMetrics(transcript);
  expect(metrics.metricStatus).toBe("available");
  expect(metrics.tokenUsage.contextInput).toBe(16);
  expect(metrics.tokenUsage.total).toBe(22);
  expect(metrics.toolCalls).toBe(2);
  expect(metrics.classified.edits).toBe(1);
  expect(metrics.modelActiveMs).toBe(5000);
});

test("TC-003: runSuite executes deterministic scenarios and writes a report", async () => {
  const root = mkdtempSync(join(tmpdir(), "cli-evals-suite-"));
  const suite = defineSuite({
    name: "deterministic",
    rootDir: root,
    scenarios: [
      {
        id: "EV-001",
        canary: true,
        mode: "deterministic",
        deterministic: { command: "node", args: ["--version"] },
      },
    ],
  });
  const { report, reportPath } = await runSuite(suite, {
    selector: { canary: true },
    repeats: 1,
    keep: false,
  });
  expect(report.ok).toBe(true);
  expect(report.reportVersion).toBe("cli-agent-evals.report/v1");
  expect(report.results[0]?.passRate).toBe("1/1");
  expect(report.results[0]?.runs[0]?.transcriptRetention).toBe("unavailable");
  expect(report.results[0]?.runs[0]?.transcriptDigest).toBeNull();
  expect(reportPath).toContain("latest.json");
  expect(parseEvalReport(JSON.parse(readFileSync(reportPath, "utf8")))).toEqual(
    report,
  );
});
