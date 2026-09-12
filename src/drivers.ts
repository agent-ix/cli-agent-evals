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

/** Terminal rows given to every evaluation session. */
export const SESSION_ROWS = 50;

/**
 * `AgentPtySession.capture()` returns the pane *including scrollback*, so a
 * prompt that appeared once matches forever. Startup decisions must be made on
 * what is on screen now, which is the final pane-height slice of that capture.
 * Sentinel detection deliberately keeps reading the whole scrollback.
 */
export function liveScreen(capture: string): string {
  return capture.split("\n").slice(-SESSION_ROWS).join("\n");
}

export class StartupNotReadyError extends Error {
  constructor(timeoutMs: number) {
    super(
      `agent host did not reach a ready prompt within ${timeoutMs}ms; ` +
        "the captured screen tail records what it was waiting on",
    );
    this.name = "StartupNotReadyError";
  }
}

/**
 * A composer alone does not mean the host can accept a submit. Codex draws
 * `Ask Codex to do anything` while its status line still reads
 * `model: loading`, and a line typed then is left sitting in the composer
 * unsent. A driver may therefore narrow readiness beyond the shared marker.
 */
export function codexIsReady(screen: string): boolean {
  return (
    /for shortcuts|Ask Codex to do anything/i.test(screen) &&
    !/model:\s+loading/i.test(screen)
  );
}

function genericIsReady(screen: string): boolean {
  return /for shortcuts|Welcome|How can I help|Ask/i.test(screen);
}

async function genericStartup(
  session: AgentPtySession,
  timeoutMs: number,
  isReady: (screen: string) => boolean = genericIsReady,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const screen = liveScreen(await session.capture().catch(() => ""));
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
    if (isReady(screen)) {
      await delay(800);
      return;
    }
    await delay(700);
  }
  throw new StartupNotReadyError(timeoutMs);
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
      // An evaluation session is non-interactive after the kickoff line, so the
      // startup update notice must never be able to consume it, and paste-burst
      // detection must never swallow the submit that follows it.
      return [
        "-c",
        "check_for_update_on_startup=false",
        "-c",
        "disable_paste_burst=true",
        ...(opts.model ? ["--model", opts.model] : []),
      ];
    },
    startup: (session, opts) =>
      genericStartup(session, opts.timeoutMs, codexIsReady),
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
