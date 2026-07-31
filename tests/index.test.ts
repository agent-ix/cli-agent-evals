import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { defineSuite, runSuite, selectScenarios } from "../src/index.js";

test("TC-001: selectScenarios requires exactly one selector", () => {
  const scenarios = [{ id: "EV-001", canary: true }, { id: "EV-002" }];
  expect(selectScenarios(scenarios, { canary: true }).map((s) => s.id)).toEqual(
    ["EV-001"],
  );
  expect(selectScenarios(scenarios, { all: true }).map((s) => s.id)).toEqual([
    "EV-001",
    "EV-002",
  ]);
  expect(
    selectScenarios(scenarios, { filter: "EV-002" }).map((s) => s.id),
  ).toEqual(["EV-002"]);
  expect(() => selectScenarios(scenarios, {})).toThrow(/select exactly one/);
});

test("TC-003: runSuite executes deterministic scenarios and writes a report", async () => {
  const root = mkdtempSync(join(tmpdir(), "cli-evals-suite-"));
  const suite = defineSuite({
    name: "deterministic",
    rootDir: root,
    scenarios: [
      {
        id: "EV-001",
        canary: true,
        mode: "deterministic",
        deterministic: { command: "node", args: ["--version"] },
      },
    ],
  });
  const { report, reportPath } = await runSuite(suite, {
    selector: { canary: true },
    repeats: 1,
    keep: false,
  });
  expect(report.ok).toBe(true);
  expect(report.results[0]?.passRate).toBe("1/1");
  expect(reportPath).toContain("latest.json");
});
