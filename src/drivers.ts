import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import { parseClaudeMetrics } from "./metrics.js";
import type {
  AgentDriver,
  AgentPtySession,
  AgentStartupOptions,
  DriverProbeResult,
  EvalContext,
} from "./types.js";

function slug(absPath: string): string {
  return absPath.replace(/[^a-zA-Z0-9]/g, "-");
}

export function claudeTranscriptPath(ctx: EvalContext): string {
  return join(
    homedir(),
    ".claude",
    "projects",
    slug(ctx.cwd),
    `${ctx.sessionId}.jsonl`,
  );
}

type StartupReady = (screen: string) => boolean;

async function waitForStartup(
  session: AgentPtySession,
  opts: AgentStartupOptions,
  ready: StartupReady,
): Promise<void> {
  const sleep = opts.sleep ?? ((ms: number) => delay(ms));
  const deadline = Date.now() + opts.timeoutMs;
  let lastScreen = "";
  let lastCaptureError: string | undefined;
  while (Date.now() < deadline) {
    let screen: string;
    try {
      screen = await session.capture();
      lastCaptureError = undefined;
    } catch (cause) {
      lastCaptureError = cause instanceof Error ? cause.message : String(cause);
      await sleep(opts.pollMs);
      continue;
    }
    lastScreen = screen;
    if (
      /Bypass Permissions mode/i.test(screen) &&
      /Yes, I accept/i.test(screen)
    ) {
      await session.sendKey("Down");
      await sleep(300);
      await session.enter();
      await sleep(1500);
      continue;
    }
    if (/trust the files|Do you trust/i.test(screen)) {
      await session.enter();
      await sleep(1500);
      continue;
    }
    if (ready(screen)) {
      await sleep(800);
      return;
    }
    await sleep(opts.pollMs);
  }
  try {
    const finalScreen = await session.capture();
    lastScreen = finalScreen;
    lastCaptureError = undefined;
    if (ready(finalScreen)) return;
  } catch (cause) {
    lastCaptureError = cause instanceof Error ? cause.message : String(cause);
  }
  const tail = lastScreen.split("\n").slice(-12).join("\n").trim();
  throw new Error(
    `agent startup did not become ready within ${opts.timeoutMs}ms` +
      (tail ? `; final screen:\n${tail}` : "; final screen was empty") +
      (lastCaptureError ? `; capture error: ${lastCaptureError}` : ""),
  );
}

export async function genericStartup(
  session: AgentPtySession,
  opts: AgentStartupOptions,
): Promise<void> {
  await waitForStartup(session, opts, (screen) =>
    /for shortcuts|Welcome|How can I help|Ask/i.test(screen),
  );
}

export function isCodexReady(screen: string): boolean {
  if (!/Ask Codex to do anything/i.test(screen)) return false;
  const modelLines = [...screen.matchAll(/model:\s+([^\r\n]+)/gi)];
  const currentModel = modelLines.at(-1)?.[1]?.trim();
  return Boolean(currentModel) && !/^loading\b/i.test(currentModel ?? "");
}

export async function codexStartup(
  session: AgentPtySession,
  opts: AgentStartupOptions,
): Promise<void> {
  await waitForStartup(session, opts, isCodexReady);
}

function commandProbe(command: string): DriverProbeResult {
  const res = spawnSync("command", ["-v", command], {
    shell: true,
    encoding: "utf8",
  });
  return res.status === 0
    ? { ok: true, command }
    : { ok: false, command, message: `${command} was not found on PATH` };
}

export const builtinDrivers: Record<string, AgentDriver> = {
  claude: {
    id: "claude",
    displayName: "Claude Code",
    defaultCommand: "claude",
    buildArgs(ctx, opts) {
      return [
        "--session-id",
        ctx.sessionId,
        "--permission-mode",
        "bypassPermissions",
        ...(opts.model ? ["--model", opts.model] : []),
        "--add-dir",
        ctx.cwd,
      ];
    },
    transcriptPath: (ctx) => claudeTranscriptPath(ctx),
    startup: (session, opts) => genericStartup(session, opts),
    parseMetrics: parseClaudeMetrics,
    probe: async () => commandProbe("claude"),
  },
  codex: {
    id: "codex",
    displayName: "OpenAI Codex",
    defaultCommand: "codex",
    buildArgs(_ctx, opts) {
      return opts.model ? ["--model", opts.model] : [];
    },
    startup: (session, opts) => codexStartup(session, opts),
    probe: async () => commandProbe("codex"),
  },
  opencode: {
    id: "opencode",
    displayName: "opencode",
    defaultCommand: "opencode",
    buildArgs(_ctx, opts) {
      return opts.model ? ["--model", opts.model] : [];
    },
    startup: (session, opts) => genericStartup(session, opts),
    probe: async () => commandProbe("opencode"),
  },
  copilot: {
    id: "copilot",
    displayName: "GitHub Copilot",
    defaultCommand: "gh",
    buildArgs(_ctx, opts) {
      return ["copilot", ...(opts.model ? ["--model", opts.model] : [])];
    },
    startup: (session, opts) => genericStartup(session, opts),
    probe: async () => {
      if (commandProbe("copilot").ok) return { ok: true, command: "copilot" };
      const gh = commandProbe("gh");
      if (gh.ok)
        return {
          ok: true,
          command: "gh",
          message: "using gh copilot command probe",
        };
      return {
        ok: false,
        command: "copilot",
        message: "neither copilot nor gh was found on PATH",
      };
    },
  },
};

export function resolveDriver<TContext extends EvalContext>(
  agent: string,
  suiteDriver?: Partial<AgentDriver<TContext>>,
): AgentDriver<TContext> {
  const base = builtinDrivers[agent];
  if (!base && !suiteDriver) throw new Error(`unknown agent driver: ${agent}`);
  return { ...(base ?? {}), ...(suiteDriver ?? {}) } as AgentDriver<TContext>;
}

export function pathWithShim(shimPath?: string): string {
  return shimPath
    ? `${shimPath}:${process.env.PATH ?? ""}`
    : (process.env.PATH ?? "");
}

export function fileExists(path: string | undefined): boolean {
  return typeof path === "string" && existsSync(path);
}
