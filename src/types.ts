export type AgentId = "claude" | "codex" | "opencode" | "copilot" | string;

export interface EvalSelector {
  canary?: boolean;
  all?: boolean;
  filter?: string;
}

export interface EvalRunOptions {
  suitePath?: string;
  selector: EvalSelector;
  agent?: AgentId;
  model?: string;
  repeats: number;
  keep: boolean;
  reportPath?: string;
  log?: (message: string) => void;
}

export interface EvalScenario<TContext extends EvalContext = EvalContext> {
  id: string;
  useCase?: string;
  title?: string;
  canary?: boolean;
  mode?: "agent" | "deterministic";
  prompt?: string | ((ctx: TContext) => string);
  setup?: (ctx: TContext) => void | Promise<void>;
  env?: (ctx: TContext) => Record<string, string>;
  expect?: unknown;
  deterministic?:
    | DeterministicCommand
    | ((ctx: TContext) => DeterministicCommand);
}

export interface DeterministicCommand {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

export interface EvalContext {
  id: string;
  workDir: string;
  cwd: string;
  sessionId: string;
  transcriptPath?: string;
  reportDir: string;
  data: Record<string, unknown>;
  cleanup: () => void;
}

export interface WorkspaceFactory<TContext extends EvalContext = EvalContext> {
  (scenario: EvalScenario<TContext>, suite: EvalSuite<TContext>): TContext;
}

export interface AssertionResult {
  ok: boolean;
  checks?: Record<string, unknown>;
  failures?: string[];
  [key: string]: unknown;
}

export interface AssertionAdapter<TContext extends EvalContext = EvalContext> {
  (
    ctx: TContext,
    scenario: EvalScenario<TContext>,
    run: AgentRunResult,
  ): AssertionResult | Promise<AssertionResult>;
}

export interface AgentRunResult {
  ok: boolean;
  exitReason: "complete" | "failed" | "timeout" | "exit" | "error";
  wallMs: number;
  screenTail?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
}

export interface TokenUsage {
  input: number;
  output: number;
  cacheCreation: number;
  cacheRead: number;
  contextInput: number;
  total: number;
}

export interface ScenarioMetrics {
  metricStatus: "available" | "unavailable";
  tokenUsage: TokenUsage;
  toolCalls: number | null;
  toolBreakdown: Record<string, number>;
  classified: Record<string, number>;
  assistantTurns: number | null;
  modelActiveMs: number | null;
  transcriptLines: number | null;
  [key: string]: unknown;
}

/**
 * Drivers live in @agent-ix/agent-drivers. Re-declaring the shape here made a
 * structurally identical but nominally distinct type, which resolveDriver then
 * refused to accept. EvalRunOptions is a superset of the package's
 * DriverOptions, so a driver built against the package works unchanged here.
 */
import type { AgentDriver } from "@agent-ix/agent-drivers";

export type { AgentDriver };

export interface AgentPtySession {
  type(text: string): Promise<void>;
  enter(): Promise<void>;
  sendKey(key: string): Promise<void>;
  capture(): Promise<string>;
  kill(): Promise<void>;
}

export interface AgentStartupOptions {
  timeoutMs: number;
  pollMs: number;
}

export interface DriverProbeResult {
  ok: boolean;
  command: string;
  message?: string;
}

export interface EvalSuite<TContext extends EvalContext = EvalContext> {
  name: string;
  rootDir: string;
  scenarios: EvalScenario<TContext>[];
  reportsDir?: string;
  workspace?: WorkspaceFactory<TContext>;
  assert?: AssertionAdapter<TContext>;
  agents?: Partial<Record<string, Partial<AgentDriver<TContext>>>>;
  buildTaskBrief?: (scenario: EvalScenario<TContext>, ctx: TContext) => string;
  kickoffLine?: (scenario: EvalScenario<TContext>, ctx: TContext) => string;
  shimPath?: (ctx: TContext) => string | undefined;
  extraEnv?: (ctx: TContext) => Record<string, string>;
}

export interface ScenarioSample {
  ok: boolean;
  latencyMs: number;
  exitReason: AgentRunResult["exitReason"];
  metricStatus: ScenarioMetrics["metricStatus"];
  tokenUsage: TokenUsage;
  toolCalls: number | null;
  toolBreakdown: Record<string, number>;
  classified: Record<string, number>;
  checks: Record<string, unknown>;
  failures: string[];
  workDir: string;
  sessionId: string;
  transcriptPath?: string;
}

export interface ScenarioResult {
  id: string;
  useCase?: string;
  ok: boolean;
  passRate: string;
  aggregate: Record<string, { p50: number | null; p95: number | null }>;
  runs: ScenarioSample[];
}

export interface EvalReport {
  ok: boolean;
  generatedAt: string;
  suite: string;
  agent?: AgentId;
  model?: string;
  repeats: number;
  results: ScenarioResult[];
  aggregates: Record<string, unknown>;
}
