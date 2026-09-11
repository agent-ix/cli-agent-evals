import { z } from "zod";

import { REPORT_VERSION } from "./report.js";
import type { EvalReport } from "./types.js";

const numberSummarySchema = z
  .object({ p50: z.number().nullable(), p95: z.number().nullable() })
  .strict();

const tokenUsageSchema = z
  .object({
    input: z.number(),
    output: z.number(),
    cacheCreation: z.number(),
    cacheRead: z.number(),
    contextInput: z.number(),
    total: z.number(),
  })
  .strict();

const safeTranscriptPathSchema = z.string().refine(isSafeRelativePath, {
  message: "transcriptPath must be a safe relative path",
});

const scenarioSampleSchema = z
  .object({
    ok: z.boolean(),
    latencyMs: z.number(),
    exitReason: z.enum(["complete", "failed", "timeout", "exit", "error"]),
    metricStatus: z.enum(["available", "unavailable"]),
    tokenUsage: tokenUsageSchema,
    toolCalls: z.number().nullable(),
    toolBreakdown: z.record(z.string(), z.number()),
    classified: z.record(z.string(), z.number()),
    checks: z.record(z.string(), z.unknown()),
    failures: z.array(z.string()),
    workDir: z.string(),
    sessionId: z.string(),
    transcriptDigest: z
      .string()
      .regex(/^[0-9a-f]{64}$/u)
      .nullable(),
    transcriptRetention: z.enum(["retained", "not-retained", "unavailable"]),
    transcriptPath: safeTranscriptPathSchema.optional(),
  })
  .strict()
  .superRefine((sample, ctx) => {
    const valid =
      (sample.transcriptRetention === "retained" &&
        sample.transcriptDigest !== null &&
        sample.transcriptPath !== undefined) ||
      (sample.transcriptRetention === "not-retained" &&
        sample.transcriptDigest !== null &&
        sample.transcriptPath === undefined) ||
      (sample.transcriptRetention === "unavailable" &&
        sample.transcriptDigest === null &&
        sample.transcriptPath === undefined);
    if (!valid) {
      ctx.addIssue({
        code: "custom",
        message: "transcript retention, digest, and path contradict",
      });
    }
  });

const scenarioResultSchema = z
  .object({
    id: z.string(),
    useCase: z.string().optional(),
    ok: z.boolean(),
    passRate: z.string(),
    aggregate: z.record(z.string(), numberSummarySchema),
    runs: z.array(scenarioSampleSchema),
  })
  .strict();

const evalReportSchema: z.ZodType<EvalReport> = z
  .object({
    reportVersion: z.literal(REPORT_VERSION),
    ok: z.boolean(),
    generatedAt: z.string(),
    suite: z.string(),
    agent: z.string().optional(),
    model: z.string().optional(),
    repeats: z.number().int().positive(),
    results: z.array(scenarioResultSchema),
    aggregates: z.record(z.string(), z.unknown()),
  })
  .strict();

export function parseEvalReport(input: unknown): EvalReport {
  return evalReportSchema.parse(input) as EvalReport;
}

function isSafeRelativePath(value: string): boolean {
  if (
    value.length === 0 ||
    value.startsWith("/") ||
    /^[A-Za-z]:/u.test(value) ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    return false;
  }
  return value
    .split("/")
    .every((segment) => segment !== "" && segment !== "." && segment !== "..");
}
