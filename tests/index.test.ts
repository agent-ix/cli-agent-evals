import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  defineSuite,
  findSentinelInText,
  findSentinelInTranscript,
  codexStartup,
  genericStartup,
  isCodexReady,
  parseClaudeMetrics,
  runSuite,
  selectScenarios,
} from "../src/index.js";
import { buildScenarioResult } from "../src/report.js";
import type { AgentPtySession } from "../src/types.js";

function fakeSession(screens: string[]): AgentPtySession {
  let captureIndex = 0;
  return {
    type: vi.fn(async () => {}),
    enter: vi.fn(async () => {}),
    sendKey: vi.fn(async () => {}),
    capture: vi.fn(async () => {
      const index = Math.min(captureIndex, screens.length - 1);
      captureIndex += 1;
      return screens[index] ?? "";
    }),
    kill: vi.fn(async () => {}),
  };
}

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

test("TC-009: Codex startup waits for a loaded model and ready composer", async () => {
  const loading = [
    "model:     loading   /model to change",
    "› Ask Codex to do anything",
  ].join("\n");
  const ready = [
    loading,
    "model:     gpt-5.6-sol high   /model to change",
    "› Ask Codex to do anything",
  ].join("\n");
  const session = fakeSession([loading, ready]);

  expect(isCodexReady(loading)).toBe(false);
  expect(isCodexReady(ready)).toBe(true);
  await codexStartup(session, {
    timeoutMs: 1000,
    pollMs: 0,
    sleep: async () => {},
  });

  expect(session.capture).toHaveBeenCalledTimes(2);
});

test("TC-010: startup timeout fails closed instead of typing into an unknown UI", async () => {
  await expect(
    genericStartup(fakeSession([""]), {
      timeoutMs: 0,
      pollMs: 0,
      sleep: async () => {},
    }),
  ).rejects.toThrow(/did not become ready/);
});

test("TC-011: scenario reports preserve terminal diagnostics", () => {
  const result = buildScenarioResult({ id: "EV-DIAGNOSTIC" }, [
    {
      ok: false,
      wallMs: 10,
      exitReason: "error",
      metrics: {
        metricStatus: "unavailable",
        tokenUsage: {
          input: 0,
          output: 0,
          cacheCreation: 0,
          cacheRead: 0,
          contextInput: 0,
          total: 0,
        },
        toolCalls: null,
        toolBreakdown: {},
        classified: {},
        assistantTurns: null,
        modelActiveMs: null,
        transcriptLines: null,
      },
      assertion: { ok: false, failures: ["startup failed"] },
      workDir: "/tmp/eval",
      sessionId: "session",
      screenTail: "model: loading",
      error: "agent startup did not become ready",
    },
  ]);

  expect(result.runs[0]?.screenTail).toBe("model: loading");
  expect(result.runs[0]?.error).toMatch(/startup/);
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
  expect(report.results[0]?.passRate).toBe("1/1");
  expect(reportPath).toContain("latest.json");
});
