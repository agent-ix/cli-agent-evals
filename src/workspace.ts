import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import type { EvalContext, EvalScenario, EvalSuite } from "./types.js";

export function defaultReportsDir(
  suite: Pick<EvalSuite, "reportsDir" | "rootDir">,
): string {
  return suite.reportsDir ?? join(suite.rootDir, "evals", "reports");
}

export function defaultWorkspace<TContext extends EvalContext = EvalContext>(
  scenario: EvalScenario<TContext>,
  suite: EvalSuite<TContext>,
): EvalContext {
  const workDir = mkdtempSync(
    join(tmpdir(), `${suite.name}-${scenario.id.toLowerCase()}-`),
  );
  mkdirSync(workDir, { recursive: true });
  return {
    id: scenario.id,
    workDir,
    cwd: workDir,
    sessionId: randomUUID(),
    reportDir: defaultReportsDir(suite),
    data: {},
    cleanup() {
      rmSync(workDir, { recursive: true, force: true });
    },
  };
}

export function resolveSuitePath(path: string): string {
  return new URL(resolve(path), "file://").href;
}
