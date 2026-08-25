import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type {
  AssertionResult,
  EvalReport,
  EvalRunOptions,
  EvalScenario,
  ScenarioMetrics,
  ScenarioResult,
} from "./types.js";

function percentile(
  values: Array<number | null | undefined>,
  p: number,
): number | null {
  const xs = values
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => a - b);
  if (xs.length === 0) return null;
  return xs[Math.min(xs.length - 1, Math.floor((p / 100) * xs.length))] ?? null;
}

function summarize(values: Array<number | null | undefined>): {
  p50: number | null;
  p95: number | null;
} {
  return { p50: percentile(values, 50), p95: percentile(values, 95) };
}

export function buildScenarioResult(
  scenario: Pick<EvalScenario, "id" | "useCase">,
  runs: Array<{
    ok: boolean;
    wallMs: number;
    exitReason: string;
    metrics: ScenarioMetrics;
    assertion: AssertionResult;
    workDir: string;
    sessionId: string;
    transcriptPath?: string;
    screenTail?: string;
    error?: string;
  }>,
): ScenarioResult {
  const samples = runs.map((run) => ({
    ok: run.ok,
    latencyMs: run.wallMs,
    exitReason: run.exitReason as ScenarioResult["runs"][number]["exitReason"],
    metricStatus: run.metrics.metricStatus,
    tokenUsage: run.metrics.tokenUsage,
    toolCalls: run.metrics.toolCalls,
    toolBreakdown: run.metrics.toolBreakdown,
    classified: run.metrics.classified,
    checks: run.assertion.checks ?? {},
    failures: run.assertion.failures ?? [],
    workDir: run.workDir,
    sessionId: run.sessionId,
    transcriptPath: run.transcriptPath,
    screenTail: run.screenTail,
    error: run.error,
  }));
  const passCount = samples.filter((sample) => sample.ok).length;
  return {
    id: scenario.id,
    useCase: scenario.useCase,
    ok: passCount === samples.length,
    passRate: `${passCount}/${samples.length}`,
    aggregate: {
      latencyMs: summarize(samples.map((sample) => sample.latencyMs)),
      tokensIn: summarize(
        samples.map((sample) => sample.tokenUsage.contextInput),
      ),
      tokensOut: summarize(samples.map((sample) => sample.tokenUsage.output)),
      toolCalls: summarize(samples.map((sample) => sample.toolCalls)),
    },
    runs: samples,
  };
}

export function buildReport(
  suite: string,
  results: ScenarioResult[],
  opts: EvalRunOptions,
): EvalReport {
  const flat = results.flatMap((result) => result.runs);
  return {
    ok: results.every((result) => result.ok),
    generatedAt: new Date().toISOString(),
    suite,
    agent: opts.agent,
    model: opts.model,
    repeats: opts.repeats,
    results,
    aggregates: {
      successRate: `${results.filter((result) => result.ok).length}/${results.length}`,
      latencyMs: summarize(flat.map((sample) => sample.latencyMs)),
      tokensIn: summarize(flat.map((sample) => sample.tokenUsage.contextInput)),
      tokensOut: summarize(flat.map((sample) => sample.tokenUsage.output)),
      toolCalls: summarize(flat.map((sample) => sample.toolCalls)),
    },
  };
}

export function writeReport(
  report: EvalReport,
  reportDir: string,
  reportPath?: string,
): string {
  const path = reportPath ?? join(reportDir, "latest.json");
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
  return path;
}
