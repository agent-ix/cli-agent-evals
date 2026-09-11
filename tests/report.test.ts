import { createHash, randomUUID } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  defineSuite,
  parseEvalReport,
  runSuite,
  type EvalContext,
  type EvalReport,
  type EvalScenario,
  type EvalSuite,
  type ScenarioMetrics,
} from "../src/index.js";

const TRANSCRIPT = [
  JSON.stringify({ type: "assistant", message: { content: [] } }),
  JSON.stringify({ type: "assistant", message: { content: [] } }),
].join("\n");

function metricsFor(path: string): ScenarioMetrics {
  const lines = readFileSync(path, "utf8").split("\n").length;
  return {
    metricStatus: "available",
    tokenUsage: {
      input: lines,
      output: 0,
      cacheCreation: 0,
      cacheRead: 0,
      contextInput: lines,
      total: lines,
    },
    toolCalls: 0,
    toolBreakdown: {},
    classified: {},
    assistantTurns: lines,
    modelActiveMs: 0,
    transcriptLines: lines,
  };
}

function fixtureSuite(
  scenarios: EvalScenario[],
  workDirs: string[],
): EvalSuite {
  const rootDir = mkdtempSync(join(tmpdir(), "cli-evals-report-root-"));
  return defineSuite({
    name: "report-contract",
    rootDir,
    scenarios,
    agents: { fixture: { parseMetrics: metricsFor } },
    workspace(scenario, suite): EvalContext {
      const workDir = mkdtempSync(join(tmpdir(), "cli-evals-report-work-"));
      workDirs.push(workDir);
      return {
        id: scenario.id,
        workDir,
        cwd: workDir,
        sessionId: randomUUID(),
        reportDir: join(suite.rootDir, "reports"),
        data: {},
        cleanup: () => rmSync(workDir, { recursive: true, force: true }),
      };
    },
  });
}

function deterministicScenario(id: string, transcript: boolean): EvalScenario {
  return {
    id,
    mode: "deterministic",
    setup(ctx) {
      if (!transcript) return;
      const sourceDir = mkdtempSync(join(tmpdir(), "cli-evals-source-"));
      ctx.transcriptPath = join(sourceDir, "transcript.jsonl");
      writeFileSync(ctx.transcriptPath, TRANSCRIPT);
    },
    deterministic: { command: process.execPath, args: ["--version"] },
  };
}

test("TC-009: default cleanup reports transcript identity without a retained path", async () => {
  const workDirs: string[] = [];
  const suite = fixtureSuite(
    [
      deterministicScenario("EV-OBSERVED", true),
      deterministicScenario("EV-UNAVAILABLE", false),
    ],
    workDirs,
  );

  const { report } = await runSuite(suite, {
    selector: { all: true },
    agent: "fixture",
    repeats: 1,
    keep: false,
  });
  const observed = report.results[0]?.runs[0];
  const unavailable = report.results[1]?.runs[0];

  expect(report.reportVersion).toBe("cli-agent-evals.report/v1");
  expect(observed?.transcriptRetention).toBe("not-retained");
  expect(observed?.transcriptDigest).toBe(
    createHash("sha256").update(TRANSCRIPT).digest("hex"),
  );
  expect(observed?.transcriptPath).toBeUndefined();
  expect(unavailable?.transcriptRetention).toBe("unavailable");
  expect(unavailable?.transcriptDigest).toBeNull();
  expect(unavailable?.transcriptPath).toBeUndefined();
  expect(workDirs.every((path) => !existsSync(path))).toBe(true);
});

test("TC-010: kept report metrics and identity share retained snapshot bytes", async () => {
  const workDirs: string[] = [];
  const observed = deterministicScenario("EV-OBSERVED", true);
  const unavailable = deterministicScenario("EV-UNAVAILABLE", false);
  const suite = fixtureSuite([observed, unavailable], workDirs);
  suite.assert = (ctx, _scenario, run) => {
    if (ctx.transcriptPath) writeFileSync(ctx.transcriptPath, "mutated source");
    return { ok: run.ok };
  };

  const { report } = await runSuite(suite, {
    selector: { all: true },
    agent: "fixture",
    repeats: 1,
    keep: true,
  });
  const sample = report.results[0]?.runs[0];
  const unavailableSample = report.results[1]?.runs[0];
  const retainedPath = resolve(sample!.workDir, sample!.transcriptPath!);
  const retainedBytes = readFileSync(retainedPath);

  expect(sample?.transcriptRetention).toBe("retained");
  expect(sample?.transcriptPath).toMatch(
    /^\.cli-agent-evals\/transcripts\/[0-9a-f]{64}\.transcript$/u,
  );
  expect(sample?.transcriptDigest).toBe(
    createHash("sha256").update(retainedBytes).digest("hex"),
  );
  expect(sample?.tokenUsage.contextInput).toBe(2);
  expect(retainedBytes.toString("utf8")).toBe(TRANSCRIPT);
  expect(unavailableSample?.transcriptRetention).toBe("unavailable");
  expect(unavailableSample?.transcriptPath).toBeUndefined();
  expect(workDirs.every(existsSync)).toBe(true);
});

test("TC-011: consumers detect retained transcript mutation and deletion", async () => {
  const workDirs: string[] = [];
  const suite = fixtureSuite(
    [deterministicScenario("EV-OBSERVED", true)],
    workDirs,
  );
  const { report } = await runSuite(suite, {
    selector: { all: true },
    agent: "fixture",
    repeats: 1,
    keep: true,
  });
  const sample = report.results[0]!.runs[0]!;
  const retainedPath = resolve(sample.workDir, sample.transcriptPath!);
  const matches = () =>
    existsSync(retainedPath) &&
    createHash("sha256").update(readFileSync(retainedPath)).digest("hex") ===
      sample.transcriptDigest;

  expect(matches()).toBe(true);
  chmodSync(retainedPath, 0o600);
  writeFileSync(retainedPath, "mutated");
  expect(matches()).toBe(false);
  rmSync(retainedPath);
  expect(matches()).toBe(false);
});

test("TC-012: decoder rejects unsafe, contradictory, and extended reports", async () => {
  const report = await retainedReportFixture();
  expect(parseEvalReport(report)).toEqual(report);

  for (const mutation of [
    (value: Record<string, unknown>) => (value.reportVersion = "v2"),
    (value: Record<string, unknown>) => (value.extra = true),
    (value: Record<string, unknown>) =>
      ((value.results as Record<string, unknown>[])[0]!.extra = true),
    (value: Record<string, unknown>) =>
      ((
        value.results as { runs: Record<string, unknown>[] }[]
      )[0]!.runs[0]!.extra = true),
    (value: Record<string, unknown>) =>
      ((
        value.results as { runs: Record<string, unknown>[] }[]
      )[0]!.runs[0]!.transcriptPath = "../escape"),
    (value: Record<string, unknown>) =>
      ((
        value.results as { runs: Record<string, unknown>[] }[]
      )[0]!.runs[0]!.transcriptPath = "/absolute"),
    (value: Record<string, unknown>) =>
      ((
        value.results as { runs: Record<string, unknown>[] }[]
      )[0]!.runs[0]!.transcriptPath = "C:/absolute"),
    (value: Record<string, unknown>) =>
      ((
        value.results as { runs: Record<string, unknown>[] }[]
      )[0]!.runs[0]!.transcriptPath = "dir\\file"),
    (value: Record<string, unknown>) =>
      ((
        value.results as { runs: Record<string, unknown>[] }[]
      )[0]!.runs[0]!.transcriptDigest = "A".repeat(64)),
    (value: Record<string, unknown>) =>
      ((
        value.results as { runs: Record<string, unknown>[] }[]
      )[0]!.runs[0]!.transcriptRetention = "unavailable"),
  ]) {
    const value = structuredClone(report) as unknown as Record<string, unknown>;
    mutation(value);
    expect(() => parseEvalReport(value)).toThrow();
  }
});

async function retainedReportFixture(): Promise<EvalReport> {
  const workDirs: string[] = [];
  const suite = fixtureSuite(
    [deterministicScenario("EV-OBSERVED", true)],
    workDirs,
  );
  return (
    await runSuite(suite, {
      selector: { all: true },
      agent: "fixture",
      repeats: 1,
      keep: true,
    })
  ).report;
}
