import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { resolveDriver, pathWithShim } from "./drivers.js";
import {
  findSentinelInText,
  findSentinelInTranscript,
  unavailableMetrics,
} from "./metrics.js";
import { buildReport, buildScenarioResult, writeReport } from "./report.js";
import { defaultKickoffLine, defaultTaskBrief } from "./sentinels.js";
import { selectScenarios } from "./suite.js";
import { defaultReportsDir, defaultWorkspace } from "./workspace.js";
import type {
  AgentDriver,
  AgentRunResult,
  AssertionResult,
  EvalContext,
  EvalReport,
  EvalRunOptions,
  EvalScenario,
  EvalSuite,
  ScenarioMetrics,
} from "./types.js";

export async function runSuite<TContext extends EvalContext>(
  suite: EvalSuite<TContext>,
  opts: EvalRunOptions,
): Promise<{ report: EvalReport; reportPath: string }> {
  const scenarios = selectScenarios(suite.scenarios, opts.selector);
  if (scenarios.length === 0) throw new Error("no scenarios selected");
  const results = [];

  for (const scenario of scenarios) {
    const runs = [];
    for (let i = 0; i < opts.repeats; i++) {
      const ctx = (suite.workspace?.(scenario, suite) ??
        defaultWorkspace(scenario, suite)) as TContext;
      try {
        await scenario.setup?.(ctx);
        const run =
          scenario.mode === "deterministic"
            ? runDeterministic(scenario, ctx)
            : await runAgentScenario(suite, scenario, ctx, opts);
        const metrics = normalizeMetrics(
          ctx.transcriptPath && run.exitReason !== "error"
            ? getDriver(suite, opts).parseMetrics?.(ctx.transcriptPath)
            : undefined,
        );
        const assertion = await assertRun(suite, ctx, scenario, run);
        runs.push({
          ok: run.ok && assertion.ok,
          wallMs: run.wallMs,
          exitReason: run.exitReason,
          metrics,
          assertion,
          workDir: ctx.workDir,
          sessionId: ctx.sessionId,
          transcriptPath: ctx.transcriptPath,
          screenTail: run.screenTail,
          error: run.error,
        });
      } finally {
        if (!opts.keep) ctx.cleanup();
      }
    }
    results.push(buildScenarioResult(scenario, runs));
  }

  const report = buildReport(suite.name, results, opts);
  const reportPath = writeReport(
    report,
    defaultReportsDir(suite),
    opts.reportPath,
  );
  return { report, reportPath };
}

function normalizeMetrics(
  metrics: ScenarioMetrics | undefined,
): ScenarioMetrics {
  const fallback = unavailableMetrics();
  if (!metrics) return fallback;
  return {
    ...fallback,
    ...metrics,
    metricStatus: metrics.metricStatus ?? "available",
    tokenUsage: { ...fallback.tokenUsage, ...(metrics.tokenUsage ?? {}) },
    toolBreakdown: metrics.toolBreakdown ?? {},
    classified: metrics.classified ?? {},
  };
}

function getDriver<TContext extends EvalContext>(
  suite: EvalSuite<TContext>,
  opts: EvalRunOptions,
): AgentDriver<TContext> {
  if (!opts.agent)
    throw new Error("--agent is required for live agent scenarios");
  return resolveDriver<TContext>(opts.agent, suite.agents?.[opts.agent]);
}

async function runAgentScenario<TContext extends EvalContext>(
  suite: EvalSuite<TContext>,
  scenario: EvalScenario<TContext>,
  ctx: TContext,
  opts: EvalRunOptions,
): Promise<AgentRunResult> {
  const driver = getDriver(suite, opts);
  const task =
    typeof scenario.prompt === "function"
      ? scenario.prompt(ctx)
      : (scenario.prompt ?? "");
  const brief = suite.buildTaskBrief?.(scenario, ctx) ?? defaultTaskBrief(task);
  writeFileSync(join(ctx.cwd, "EVAL_TASK.md"), brief);
  const kickoff = suite.kickoffLine?.(scenario, ctx) ?? defaultKickoffLine();
  const shimPath = suite.shimPath?.(ctx);
  const overrides = {
    PATH: pathWithShim(shimPath),
    ...(suite.extraEnv?.(ctx) ?? {}),
    ...(scenario.env?.(ctx) ?? {}),
  };
  const env = {
    ...process.env,
    ...overrides,
  };
  ctx.transcriptPath = driver.transcriptPath?.(ctx, opts);

  const mod = await import("@agent-ix/agent-pty");
  const command = driver.defaultCommand;
  const envArgs = Object.entries(overrides)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .map(([key, value]) => `${key}=${value}`);
  const t0 = Date.now();
  const session = await mod.startSession({
    bin: "env",
    args: [...envArgs, command, ...driver.buildArgs(ctx, opts)],
    cwd: ctx.cwd,
    env,
    cols: 200,
    rows: 50,
    sessionName: `clievals-${suite.name}-${scenario.id.toLowerCase()}-${ctx.sessionId.slice(0, 8)}`,
  });

  let exitReason: AgentRunResult["exitReason"] = "timeout";
  let screenTail = "";
  let error: string | undefined;
  try {
    await driver.startup?.(session, { timeoutMs: 45_000, pollMs: 700 });
    if (driver.submit) {
      await driver.submit(session, kickoff, {
        inputSettleMs: 500,
        confirmationMs: 800,
      });
    } else {
      await session.type(kickoff);
      await delay(500);
      await session.enter();
    }
    const deadline = Date.now() + 8 * 60_000;
    while (Date.now() < deadline) {
      const transcriptSentinel = ctx.transcriptPath
        ? findSentinelInTranscript(ctx.transcriptPath)
        : null;
      const screen = await session.capture().catch(() => null);
      if (screen === null) {
        exitReason = "exit";
        break;
      }
      const sentinel = transcriptSentinel ?? findSentinelInText(screen);
      if (sentinel === "complete") {
        exitReason = "complete";
        break;
      }
      if (sentinel === "failed") {
        exitReason = "failed";
        break;
      }
      await delay(2000);
    }
  } catch (cause) {
    exitReason = "error";
    error = cause instanceof Error ? cause.message : String(cause);
  } finally {
    screenTail = await session.capture().catch(() => "");
    await session.kill().catch(() => {});
  }
  return {
    ok: exitReason === "complete",
    exitReason,
    wallMs: Date.now() - t0,
    screenTail: screenTail.split("\n").slice(-60).join("\n"),
    error,
  };
}

function runDeterministic<TContext extends EvalContext>(
  scenario: EvalScenario<TContext>,
  ctx: TContext,
): AgentRunResult {
  const command =
    typeof scenario.deterministic === "function"
      ? scenario.deterministic(ctx)
      : scenario.deterministic;
  if (!command)
    throw new Error(`deterministic scenario ${scenario.id} has no command`);
  const t0 = Date.now();
  const res = spawnSync(command.command, command.args ?? [], {
    cwd: command.cwd ?? ctx.cwd,
    env: { ...process.env, ...(command.env ?? {}) },
    encoding: "utf8",
    timeout: command.timeoutMs,
  });
  return {
    ok: (res.status ?? 1) === 0,
    exitReason: (res.status ?? 1) === 0 ? "complete" : "failed",
    wallMs: Date.now() - t0,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
    exitCode: res.status,
  };
}

async function assertRun<TContext extends EvalContext>(
  suite: EvalSuite<TContext>,
  ctx: TContext,
  scenario: EvalScenario<TContext>,
  run: AgentRunResult,
): Promise<AssertionResult> {
  if (suite.assert) return await suite.assert(ctx, scenario, run);
  return {
    ok: run.ok,
    checks: { exitReason: run.exitReason },
    failures: run.ok ? [] : [`run ended ${run.exitReason}`],
  };
}
