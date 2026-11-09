import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, expect, test, vi } from "vitest";

import { main } from "../src/cli.js";

async function capture(argv: string[]): Promise<string> {
  let out = "";
  vi.spyOn(process.stdout, "write").mockImplementation(((chunk: unknown) => {
    out += String(chunk);
    return true;
  }) as typeof process.stdout.write);
  vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    out += `${args.join(" ")}\n`;
  });
  await main(argv);
  return out;
}

afterEach(() => {
  vi.restoreAllMocks();
});

test("CLI init dispatches through BaseCommand and prints a suite template", async () => {
  const out = await capture(["init"]);
  expect(out).toContain("defineSuite");
  expect(out).toContain("EV-001");
});

test("CLI list parses --suite and lists the suite's scenarios", async () => {
  const root = mkdtempSync(join(tmpdir(), "cli-evals-cli-"));
  const suite = join(root, "cli-agent-evals.config.mjs");
  writeFileSync(
    suite,
    `export default {
  name: "fixture",
  rootDir: ${JSON.stringify(root)},
  scenarios: [{ id: "EV-042", canary: true, title: "Fixture scenario", prompt: "go" }],
};
`,
  );
  const out = await capture(["list", "--suite", suite]);
  expect(out).toContain("EV-042");
  expect(out).toContain("Fixture scenario");
});
