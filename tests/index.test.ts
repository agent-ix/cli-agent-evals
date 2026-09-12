import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  SESSION_ROWS,
  StartupNotReadyError,
  KICKOFF_SUBMIT_DELAY_MS,
  builtinDrivers,
  codexIsReady,
  liveScreen,
  defineSuite,
  describeProvider,
  findSentinelInText,
  findSentinelInTranscript,
  prepareProvider,
  assertProvider,
  parseEvalReport,
  parseClaudeMetrics,
  runSuite,
  selectScenarios,
} from "../src/index.js";

function providerFixture(mode: string): string {
  const root = mkdtempSync(join(tmpdir(), "cli-evals-provider-"));
  const path = join(root, "provider.mjs");
  writeFileSync(
    path,
    `import { readFileSync } from "node:fs";
const mode = ${JSON.stringify(mode)};
if (mode === "exit") process.exit(3);
if (mode === "timeout") Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
if (mode === "oversized") {
  process.stdout.write("x".repeat(1024 * 1024 + 1));
  process.exit(0);
}
const request = JSON.parse(readFileSync(0, "utf8"));
const result = mode === "wrong-protocol"
  ? { protocol: "wrong/v1", operation: request.operation }
  : request.operation === "describe"
    ? { protocol: "cli-agent-evals.external-provider-result/v1", operation: "describe", scenarios: [{ id: "EA-001", use_case: "existing-profile", canary: true }] }
    : request.operation === "prepare"
      ? { protocol: "cli-agent-evals.external-provider-result/v1", operation: "prepare", prompt: "perform the fixture task", environment: mode === "bad-environment" ? { FIXTURE_MODE: 1 } : { FIXTURE_MODE: "yes" } }
      : { protocol: "cli-agent-evals.external-provider-result/v1", operation: "assert", assertion: { ok: true, checks: { source: "provider" }, failures: [] } };
process.stdout.write(JSON.stringify(result) + "\\n");
`,
  );
  return path;
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

test("TC-015: external provider describes prepares and asserts through the typed boundary", () => {
  const provider = { command: process.execPath, args: [providerFixture("ok")] };
  const [scenario] = describeProvider(provider);
  expect(scenario).toMatchObject({
    id: "EA-001",
    useCase: "existing-profile",
    canary: true,
  });
  const context = {
    id: "EA-001",
    workDir: "/tmp/work",
    cwd: "/tmp/work",
    sessionId: "session-1",
    reportDir: "/tmp/reports",
    data: {},
    cleanup() {},
  };
  expect(prepareProvider(provider, context, scenario!)).toEqual({
    prompt: "perform the fixture task",
    environment: { FIXTURE_MODE: "yes" },
  });
  expect(
    assertProvider(provider, context, scenario!, {
      ok: true,
      exitReason: "complete",
      wallMs: 1,
    }),
  ).toEqual({ ok: true, checks: { source: "provider" }, failures: [] });
});

test("TC-016: external provider refuses a wrong protocol without an assertion", () => {
  const provider = {
    command: process.execPath,
    args: [providerFixture("wrong-protocol")],
  };
  expect(() => describeProvider(provider)).toThrow(/protocol/);
});

test("TC-016: external provider refuses invalid environment and bounded process failures", async () => {
  const context = {
    id: "EA-001",
    workDir: "/tmp/work",
    cwd: "/tmp/work",
    sessionId: "session-1",
    reportDir: "/tmp/reports",
    data: {},
    cleanup() {},
  };
  const scenario = { id: "EA-001" };
  expect(() =>
    prepareProvider(
      { command: process.execPath, args: [providerFixture("bad-environment")] },
      context,
      scenario,
    ),
  ).toThrow(/environment/);
  expect(() =>
    describeProvider({
      command: process.execPath,
      args: [providerFixture("exit")],
    }),
  ).toThrow(/did not complete/);
  expect(() =>
    describeProvider({
      command: process.execPath,
      args: [providerFixture("timeout")],
      timeoutMs: 1,
    }),
  ).toThrow(/invocation failed/);
  expect(() =>
    describeProvider({
      command: process.execPath,
      args: [providerFixture("oversized")],
    }),
  ).toThrow(/response/);
  await expect(
    runSuite(
      defineSuite({
        name: "ambiguous-provider-suite",
        rootDir: "/tmp",
        scenarios: [{ id: "EV-001" }],
        provider: { command: process.execPath, args: [providerFixture("ok")] },
      }),
      { selector: { all: true }, repeats: 1, keep: false },
    ),
  ).rejects.toThrow(/either scenarios or an external provider/);
});

test("TC-017: external provider remains a direct semantic boundary", () => {
  const source = readFileSync(
    new URL("../src/provider.ts", import.meta.url),
    "utf8",
  );
  expect(source).toContain("shell: false");
  expect(source).not.toContain("agent-pty");
  expect(source).not.toContain("mkdtemp");
  expect(source).not.toContain("writeReport");
});

test("TC-018: runner reports its package version without loading a suite", () => {
  const packageVersion = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  ).version;
  const result = spawnSync(
    process.execPath,
    [new URL("../bin/cli-evals.js", import.meta.url).pathname, "--version"],
    { encoding: "utf8" },
  );
  expect(result.status).toBe(0);
  expect(result.stdout).toBe(`${packageVersion}\n`);
  expect(result.stderr).toBe("");
});

test("TC-019: the codex driver suppresses the startup update check", () => {
  const args = builtinDrivers.codex!.buildArgs(
    {} as never,
    { agent: "codex", selector: "canary" } as never,
  );
  expect(args).toEqual([
    "-c",
    "check_for_update_on_startup=false",
    "-c",
    "disable_paste_burst=true",
  ]);

  const withModel = builtinDrivers.codex!.buildArgs(
    {} as never,
    { agent: "codex", selector: "canary", model: "gpt-5.6-sol" } as never,
  );
  expect(withModel).toEqual([
    "-c",
    "check_for_update_on_startup=false",
    "-c",
    "disable_paste_burst=true",
    "--model",
    "gpt-5.6-sol",
  ]);
});

test("TC-021: a dismissed prompt in scrollback does not block readiness", async () => {
  // capture() returns the pane including scrollback, so the dismissed trust
  // prompt stays in the text forever. Only the live screen may decide startup.
  const dismissed = [
    "> You are in /tmp/eval",
    "  Do you trust the contents of this directory?",
    "› 1. Yes, continue",
    "  2. No, quit",
  ].join("\n");
  const ready = ["› Ask Codex to do anything", "  ? for shortcuts"].join("\n");
  const padding = Array.from({ length: SESSION_ROWS }, () => "").join("\n");
  const capture = `${dismissed}\n${padding}\n${ready}`;

  expect(liveScreen(capture)).not.toContain("Do you trust");
  expect(liveScreen(capture)).toContain("Ask Codex to do anything");

  let enterPresses = 0;
  const session = {
    capture: async () => capture,
    sendKey: async () => {},
    enter: async () => {
      enterPresses += 1;
    },
    type: async () => {},
    kill: async () => {},
  };
  await builtinDrivers.codex!.startup!(session as never, {
    timeoutMs: 5_000,
    pollMs: 10,
  });
  expect(enterPresses).toBe(0);
});

test("TC-023: the kickoff line is submitted outside the paste-burst window", () => {
  expect(KICKOFF_SUBMIT_DELAY_MS).toBeGreaterThanOrEqual(500);
  const source = readFileSync(
    new URL("../src/runner.ts", import.meta.url),
    "utf8",
  );
  const typed = source.indexOf("await session.type(kickoff);");
  const settled = source.indexOf("await delay(KICKOFF_SUBMIT_DELAY_MS);");
  const submitted = source.indexOf("await session.enter();", typed);
  expect(typed).toBeGreaterThan(-1);
  expect(settled).toBeGreaterThan(typed);
  expect(submitted).toBeGreaterThan(settled);
});

test("TC-022: a codex composer drawn while the model loads is not ready", () => {
  const loading = [
    "| model:     loading   /model to change |",
    "› Ask Codex to do anything",
    "  ? for shortcuts",
  ].join("\n");
  const loaded = [
    "| model:     gpt-5.6-sol high   /model to change |",
    "› Ask Codex to do anything",
    "  ? for shortcuts",
  ].join("\n");
  expect(codexIsReady(loading)).toBe(false);
  expect(codexIsReady(loaded)).toBe(true);
});

test("TC-020: a host that never becomes ready fails startup instead of timing out", async () => {
  const session = {
    capture: async () => "✨ Update available! 0.153.4 -> 0.154.0",
    sendKey: async () => {},
    enter: async () => {},
    type: async () => {
      throw new Error(
        "the kickoff line must never be typed into an unready host",
      );
    },
    kill: async () => {},
  };
  await expect(
    builtinDrivers.codex!.startup!(session as never, {
      timeoutMs: 60,
      pollMs: 10,
    }),
  ).rejects.toBeInstanceOf(StartupNotReadyError);
});
