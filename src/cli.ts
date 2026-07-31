import { BaseCommand } from "@agent-ix/ix-cli-core";
import { Args, Flags } from "@oclif/core";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { builtinDrivers } from "@agent-ix/agent-drivers";
import { runSuite } from "./runner.js";
import { loadSuite } from "./suite.js";
import { resolveSuitePath } from "./workspace.js";
import type { EvalRunOptions, EvalSelector } from "./types.js";

abstract class SuiteCommand extends BaseCommand {
  static override baseFlags = {
    ...BaseCommand.baseFlags,
    suite: Flags.string({
      description: "Path to cli-agent-evals.config.mjs/js.",
      default: "cli-agent-evals.config.mjs",
    }),
  };

  protected async suite() {
    const { flags } = await this.parse(this.constructor as typeof SuiteCommand);
    const suitePath = resolve(flags.suite);
    if (!existsSync(suitePath)) {
      this.error(`suite config not found: ${suitePath}`, { exit: 1 });
    }
    return await loadSuite(resolveSuitePath(suitePath));
  }
}

class ListCommand extends SuiteCommand {
  static override description = "List scenarios in a suite.";

  async run(): Promise<void> {
    const suite = await this.suite();
    for (const scenario of suite.scenarios) {
      this.log(
        [
          scenario.id.padEnd(8),
          scenario.canary ? "canary" : "      ",
          scenario.mode ?? "agent",
          scenario.useCase ?? "",
          scenario.title ?? "",
        ].join("  "),
      );
    }
  }
}

class RunCommand extends SuiteCommand {
  static override description = "Run live or deterministic eval scenarios.";
  static override flags = {
    ...SuiteCommand.baseFlags,
    canary: Flags.boolean({ description: "Run canary scenarios." }),
    all: Flags.boolean({ description: "Run every scenario." }),
    filter: Flags.string({ description: "Run one scenario id." }),
    agent: Flags.string({ description: "Agent driver id." }),
    model: Flags.string({ description: "Agent model id." }),
    repeats: Flags.integer({ description: "Repeat count.", default: 1 }),
    keep: Flags.boolean({
      description: "Keep scenario workdirs.",
      default: false,
    }),
    report: Flags.string({ description: "Report JSON output path." }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(RunCommand);
    const suite = await loadSuite(resolveSuitePath(resolve(flags.suite)));
    const opts: EvalRunOptions = {
      suitePath: resolve(flags.suite),
      selector: selectorFromFlags(flags),
      agent: flags.agent,
      model: flags.model,
      repeats: flags.repeats,
      keep: flags.keep,
      reportPath: flags.report,
      log: (message) => this.log(message),
    };
    const { report, reportPath } = await runSuite(suite, opts);
    printSummary(this, report);
    this.log(`\nreport: ${reportPath}`);
    if (!report.ok) this.exit(1);
  }
}

class RebuildCommand extends SuiteCommand {
  static override description =
    "Print a prior report summary without rerunning agents.";
  static override flags = {
    ...SuiteCommand.baseFlags,
    report: Flags.string({
      description: "Report JSON path.",
      default: "evals/reports/latest.json",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(RebuildCommand);
    const path = resolve(flags.report);
    const report = JSON.parse(readFileSync(path, "utf8"));
    printSummary(this, report);
    this.log(`\nrebuilt summary from: ${path}`);
  }
}

class DoctorCommand extends BaseCommand {
  static override description = "Check local prerequisites for live evals.";

  async run(): Promise<void> {
    for (const driver of Object.values(builtinDrivers)) {
      const probe = await driver.probe?.();
      this.log(
        `${driver.id.padEnd(8)} ${probe?.ok ? "ok" : "missing"} ${probe?.message ?? probe?.command ?? ""}`,
      );
    }
  }
}

class InitCommand extends BaseCommand {
  static override description = "Print a minimal suite config template.";

  async run(): Promise<void> {
    this.log(`import { defineSuite } from "@agent-ix/cli-agent-evals";

export default defineSuite({
  name: "my-suite",
  rootDir: import.meta.dirname,
  scenarios: [
    {
      id: "EV-001",
      canary: true,
      prompt: "Run the CLI workflow and print the success sentinel when done.",
    },
  ],
});
`);
  }
}

class HelpCommand extends BaseCommand {
  static override args = {
    command: Args.string({ required: false }),
  };

  async run(): Promise<void> {
    this.log(`cli-evals <command>

Commands:
  list      List suite scenarios
  run       Run scenarios
  rebuild   Print a prior report summary
  doctor    Check real agent prerequisites
  init      Print a suite config template

Run "cli-evals <command> --help" for command flags.`);
  }
}

function selectorFromFlags(flags: Record<string, unknown>): EvalSelector {
  return {
    canary: flags.canary === true,
    all: flags.all === true,
    filter: typeof flags.filter === "string" ? flags.filter : undefined,
  };
}

function printSummary(
  cmd: BaseCommand,
  report: {
    results: Array<{
      id: string;
      ok: boolean;
      passRate: string;
      aggregate: Record<string, { p50: number | null }>;
    }>;
    aggregates?: Record<string, unknown>;
  },
): void {
  cmd.log("");
  cmd.log("ID       OK  pass   lat");
  cmd.log("-------- --- ------ ----");
  for (const result of report.results) {
    const lat = result.aggregate.latencyMs?.p50;
    cmd.log(
      `${result.id.padEnd(8)} ${result.ok ? "yes" : "no "} ${result.passRate.padEnd(6)} ${lat == null ? "-" : `${Math.round(lat / 1000)}s`}`,
    );
  }
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const [command = "help", ...rest] = argv;
  const commands: Record<string, { run(argv: string[]): Promise<unknown> }> = {
    list: ListCommand,
    run: RunCommand,
    rebuild: RebuildCommand,
    doctor: DoctorCommand,
    init: InitCommand,
    help: HelpCommand,
    "--help": HelpCommand,
    "-h": HelpCommand,
  };
  const Command = commands[command];
  if (!Command) {
    console.error(`unknown command: ${command}`);
    await HelpCommand.run([]);
    process.exit(2);
  }
  await Command.run(rest);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.stack : String(err));
    process.exit(1);
  });
}
