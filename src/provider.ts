import { spawnSync } from "node:child_process";

import type {
  AgentRunResult,
  AssertionResult,
  EvalContext,
  EvalScenario,
  ExternalScenarioProvider,
} from "./types.js";

const REQUEST_PROTOCOL = "cli-agent-evals.external-provider-request/v1";
const RESULT_PROTOCOL = "cli-agent-evals.external-provider-result/v1";
const MAX_INPUT_BYTES = 1024 * 1024;
const MAX_OUTPUT_BYTES = 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 15_000;

interface ProviderContext {
  scenario: {
    id: string;
    use_case?: string;
    title?: string;
    canary?: boolean;
  };
  work_dir: string;
  cwd: string;
  session_id: string;
  report_dir: string;
}

interface ProviderRequest {
  protocol: typeof REQUEST_PROTOCOL;
  operation: "describe" | "prepare" | "assert";
  context: ProviderContext;
  run?: AgentRunResult;
}

interface ProviderResponse {
  protocol: typeof RESULT_PROTOCOL;
  operation: ProviderRequest["operation"];
  scenarios?: unknown;
  prompt?: unknown;
  environment?: unknown;
  assertion?: unknown;
}

type ProviderScenario = Pick<
  EvalScenario,
  "id" | "useCase" | "title" | "canary"
>;

export interface PreparedScenario {
  prompt: string;
  environment: Record<string, string>;
}

export function describeProvider(
  provider: ExternalScenarioProvider,
): EvalScenario[] {
  const response = invoke(provider, {
    protocol: REQUEST_PROTOCOL,
    operation: "describe",
    context: emptyContext(),
  });
  if (!Array.isArray(response.scenarios)) {
    throw new Error("provider describe response has no scenario catalogue");
  }
  requireResponseFields(response, ["protocol", "operation", "scenarios"]);
  const scenarios = response.scenarios.map(parseScenario);
  const ids = new Set(scenarios.map((scenario) => scenario.id));
  if (ids.size !== scenarios.length || scenarios.length === 0) {
    throw new Error(
      "provider describe response has duplicate or empty scenarios",
    );
  }
  return scenarios;
}

export function prepareProvider(
  provider: ExternalScenarioProvider,
  ctx: EvalContext,
  scenario: ProviderScenario,
): PreparedScenario {
  const response = invoke(provider, request("prepare", ctx, scenario));
  if (typeof response.prompt !== "string" || response.prompt.length === 0) {
    throw new Error("provider prepare response has no prompt");
  }
  requireResponseFields(
    response,
    ["protocol", "operation", "prompt"],
    ["protocol", "operation", "prompt", "environment"],
  );
  return {
    prompt: response.prompt,
    environment: parseEnvironment(response.environment),
  };
}

export function assertProvider(
  provider: ExternalScenarioProvider,
  ctx: EvalContext,
  scenario: ProviderScenario,
  run: AgentRunResult,
): AssertionResult {
  const response = invoke(provider, request("assert", ctx, scenario, run));
  if (
    !isRecord(response.assertion) ||
    typeof response.assertion.ok !== "boolean"
  ) {
    throw new Error("provider assert response has no typed assertion");
  }
  requireResponseFields(response, ["protocol", "operation", "assertion"]);
  requireKnownKeys(response.assertion, ["ok", "checks", "failures"]);
  const failures = response.assertion.failures;
  if (
    failures !== undefined &&
    (!Array.isArray(failures) ||
      failures.some((failure) => typeof failure !== "string"))
  ) {
    throw new Error("provider assertion failures are invalid");
  }
  const checks = response.assertion.checks;
  if (checks !== undefined && !isRecord(checks)) {
    throw new Error("provider assertion checks are invalid");
  }
  return { ok: response.assertion.ok, checks, failures };
}

function request(
  operation: "prepare" | "assert",
  ctx: EvalContext,
  scenario: ProviderScenario,
  run?: AgentRunResult,
): ProviderRequest {
  return {
    protocol: REQUEST_PROTOCOL,
    operation,
    context: {
      scenario: scenarioMetadata(scenario),
      work_dir: ctx.workDir,
      cwd: ctx.cwd,
      session_id: ctx.sessionId,
      report_dir: ctx.reportDir,
    },
    ...(run ? { run } : {}),
  };
}

function emptyContext(): ProviderContext {
  return {
    scenario: { id: "" },
    work_dir: "",
    cwd: "",
    session_id: "",
    report_dir: "",
  };
}

function scenarioMetadata(
  scenario: ProviderScenario,
): ProviderContext["scenario"] {
  return {
    id: scenario.id,
    ...(scenario.useCase ? { use_case: scenario.useCase } : {}),
    ...(scenario.title ? { title: scenario.title } : {}),
    ...(scenario.canary ? { canary: true } : {}),
  };
}

function invoke(
  provider: ExternalScenarioProvider,
  request: ProviderRequest,
): ProviderResponse {
  if (
    typeof provider.command !== "string" ||
    provider.command.length === 0 ||
    (provider.args !== undefined &&
      (!Array.isArray(provider.args) ||
        provider.args.some((argument) => typeof argument !== "string")))
  ) {
    throw new Error("provider command configuration is invalid");
  }
  const input = `${JSON.stringify(request)}\n`;
  if (Buffer.byteLength(input) > MAX_INPUT_BYTES) {
    throw new Error("provider request exceeds input limit");
  }
  const result = spawnSync(provider.command, provider.args ?? [], {
    input,
    encoding: "utf8",
    timeout: provider.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxBuffer: MAX_OUTPUT_BYTES + 1,
    shell: false,
  });
  if (result.error) {
    throw new Error(`provider invocation failed: ${result.error.message}`);
  }
  if (result.status !== 0 || result.signal) {
    throw new Error("provider invocation did not complete");
  }
  const output = result.stdout ?? "";
  if (Buffer.byteLength(output) > MAX_OUTPUT_BYTES) {
    throw new Error("provider response exceeds output limit");
  }
  const lines = output.trimEnd().split("\n");
  if (lines.length !== 1 || lines[0]?.length === 0) {
    throw new Error("provider response must be one JSON line");
  }
  let response: unknown;
  try {
    response = JSON.parse(lines[0] ?? "");
  } catch {
    throw new Error("provider response is invalid JSON");
  }
  if (
    !isRecord(response) ||
    response.protocol !== RESULT_PROTOCOL ||
    response.operation !== request.operation
  ) {
    throw new Error("provider response protocol is invalid");
  }
  return response as unknown as ProviderResponse;
}

function parseScenario(value: unknown): EvalScenario {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    value.id.length === 0
  ) {
    throw new Error("provider scenario is invalid");
  }
  if (
    (value.use_case !== undefined && typeof value.use_case !== "string") ||
    (value.title !== undefined && typeof value.title !== "string") ||
    (value.canary !== undefined && typeof value.canary !== "boolean")
  ) {
    throw new Error("provider scenario metadata is invalid");
  }
  requireKnownKeys(value, ["id", "use_case", "title", "canary"]);
  return {
    id: value.id,
    ...(typeof value.use_case === "string" ? { useCase: value.use_case } : {}),
    ...(typeof value.title === "string" ? { title: value.title } : {}),
    ...(value.canary === true ? { canary: true } : {}),
  };
}

function parseEnvironment(value: unknown): Record<string, string> {
  if (value === undefined) return {};
  if (!isRecord(value)) {
    throw new Error("provider environment is invalid");
  }
  if (
    Object.entries(value).some(
      ([name, entry]) =>
        name.length === 0 ||
        name.includes("=") ||
        name.includes("\0") ||
        typeof entry !== "string" ||
        entry.includes("\0"),
    )
  )
    throw new Error("provider environment is invalid");
  return value as Record<string, string>;
}

function requireResponseFields(
  value: ProviderResponse,
  expected: string[],
  allowed = expected,
): void {
  const record = value as unknown as Record<string, unknown>;
  requireKnownKeys(record, allowed);
  if (expected.some((key) => !(key in record))) {
    throw new Error("provider response has missing fields");
  }
}

function requireKnownKeys(
  value: Record<string, unknown>,
  expected: string[],
): void {
  if (Object.keys(value).some((key) => !expected.includes(key))) {
    throw new Error("provider response has unknown fields");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
