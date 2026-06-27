import type {
  EvalContext,
  EvalScenario,
  EvalSelector,
  EvalSuite,
} from "./types.js";

export function defineSuite<TContext extends EvalContext>(
  suite: EvalSuite<TContext>,
): EvalSuite<TContext> {
  return suite;
}

export function selectScenarios<TContext extends EvalContext>(
  scenarios: readonly EvalScenario<TContext>[],
  selector: EvalSelector,
): EvalScenario<TContext>[] {
  const selected = [
    selector.canary,
    selector.all,
    Boolean(selector.filter),
  ].filter(Boolean);
  if (selected.length !== 1) {
    throw new Error("select exactly one of --canary, --all, or --filter <id>");
  }
  if (selector.all) return [...scenarios];
  if (selector.canary) return scenarios.filter((scenario) => scenario.canary);
  return scenarios.filter((scenario) => scenario.id === selector.filter);
}

export async function loadSuite<TContext extends EvalContext = EvalContext>(
  pathOrUrl: string,
): Promise<EvalSuite<TContext>> {
  const mod = await import(pathOrUrl);
  const suite = (mod.default ?? mod.suite) as EvalSuite<TContext> | undefined;
  if (
    !suite ||
    typeof suite.name !== "string" ||
    !Array.isArray(suite.scenarios)
  ) {
    throw new Error(
      `suite module did not export a valid EvalSuite: ${pathOrUrl}`,
    );
  }
  return suite;
}
