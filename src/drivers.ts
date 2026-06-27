import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import { parseClaudeMetrics } from "./metrics.js";
import type {
  AgentDriver,
  AgentPtySession,
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

async function genericStartup(
  session: AgentPtySession,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const screen = await session.capture().catch(() => "");
    if (
      /Bypass Permissions mode/i.test(screen) &&
      /Yes, I accept/i.test(screen)
    ) {
      await session.sendKey("Down");
      await delay(300);
      await session.enter();
      await delay(1500);
      continue;
    }
    if (/trust the files|Do you trust/i.test(screen)) {
      await session.enter();
      await delay(1500);
      continue;
    }
    if (/for shortcuts|Welcome|How can I help|Ask/i.test(screen)) {
      await delay(800);
      return;
    }
    await delay(700);
  }
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
    startup: (session, opts) => genericStartup(session, opts.timeoutMs),
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
    startup: (session, opts) => genericStartup(session, opts.timeoutMs),
    probe: async () => commandProbe("codex"),
  },
  opencode: {
    id: "opencode",
    displayName: "opencode",
    defaultCommand: "opencode",
    buildArgs(_ctx, opts) {
      return opts.model ? ["--model", opts.model] : [];
    },
    startup: (session, opts) => genericStartup(session, opts.timeoutMs),
    probe: async () => commandProbe("opencode"),
  },
  copilot: {
    id: "copilot",
    displayName: "GitHub Copilot",
    defaultCommand: "gh",
    buildArgs(_ctx, opts) {
      return ["copilot", ...(opts.model ? ["--model", opts.model] : [])];
    },
    startup: (session, opts) => genericStartup(session, opts.timeoutMs),
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
