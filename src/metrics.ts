import { existsSync, readFileSync } from "node:fs";

import { SENTINEL_COMPLETE, SENTINEL_FAILED } from "./sentinels.js";
import type { ScenarioMetrics, TokenUsage } from "./types.js";

const zeroUsage = (): TokenUsage => ({
  input: 0,
  output: 0,
  cacheCreation: 0,
  cacheRead: 0,
  contextInput: 0,
  total: 0,
});

export function unavailableMetrics(): ScenarioMetrics {
  return {
    metricStatus: "unavailable",
    tokenUsage: zeroUsage(),
    toolCalls: null,
    toolBreakdown: {},
    classified: {},
    assistantTurns: null,
    modelActiveMs: null,
    transcriptLines: null,
  };
}

export function readJsonl(path: string): unknown[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as unknown];
      } catch {
        return [];
      }
    });
}

export function findSentinelInText(text: string): "complete" | "failed" | null {
  if (text.includes(SENTINEL_COMPLETE)) return "complete";
  if (text.includes(SENTINEL_FAILED)) return "failed";
  return null;
}

export function findSentinelInTranscript(
  path: string,
): "complete" | "failed" | null {
  if (!existsSync(path)) return null;
  const lines = readJsonl(path) as Array<Record<string, unknown>>;
  const toolNames = new Map<string, string>();

  for (const line of lines) {
    const message = line.message as Record<string, unknown> | undefined;
    const content = message?.content;

    if (line.type === "assistant" && Array.isArray(content)) {
      for (const block of content as Array<Record<string, unknown>>) {
        if (block.type === "text" && typeof block.text === "string") {
          const sentinel = findSentinelInText(block.text);
          if (sentinel) return sentinel;
        }
        if (block.type !== "tool_use") continue;
        const id = typeof block.id === "string" ? block.id : undefined;
        const name = typeof block.name === "string" ? block.name : "unknown";
        if (id) toolNames.set(id, name);
        if (name === "Read") continue;
        const sentinel = findSentinelInText(JSON.stringify(block.input ?? {}));
        if (sentinel) return sentinel;
      }
    }

    if (line.type !== "user" || !Array.isArray(content)) continue;
    for (const block of content as Array<Record<string, unknown>>) {
      if (block.type !== "tool_result") continue;
      const toolUseId =
        typeof block.tool_use_id === "string" ? block.tool_use_id : undefined;
      if (toolUseId && toolNames.get(toolUseId) === "Read") continue;
      const text =
        typeof block.content === "string"
          ? block.content
          : JSON.stringify(block.content ?? "");
      const sentinel = findSentinelInText(text);
      if (sentinel) return sentinel;
    }
  }

  return null;
}

export function parseClaudeMetrics(path: string): ScenarioMetrics {
  const lines = readJsonl(path) as Array<Record<string, unknown>>;
  const tokenUsage = zeroUsage();
  const toolBreakdown: Record<string, number> = {};
  const classified: Record<string, number> = {};
  const timestamps: number[] = [];
  let assistantTurns = 0;
  let toolCalls = 0;

  for (const line of lines) {
    const timestamp = line.timestamp;
    if (typeof timestamp === "string") {
      const t = Date.parse(timestamp);
      if (!Number.isNaN(t)) timestamps.push(t);
    }
    if (line.type !== "assistant") continue;
    assistantTurns += 1;
    const message = line.message as Record<string, unknown> | undefined;
    const usage = message?.usage as Record<string, number> | undefined;
    if (usage) {
      tokenUsage.input += usage.input_tokens ?? 0;
      tokenUsage.output += usage.output_tokens ?? 0;
      tokenUsage.cacheCreation += usage.cache_creation_input_tokens ?? 0;
      tokenUsage.cacheRead += usage.cache_read_input_tokens ?? 0;
    }
    const content = message?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content as Array<Record<string, unknown>>) {
      if (block.type !== "tool_use") continue;
      toolCalls += 1;
      const name = typeof block.name === "string" ? block.name : "unknown";
      toolBreakdown[name] = (toolBreakdown[name] ?? 0) + 1;
      if (name === "Edit" || name === "Write")
        classified.edits = (classified.edits ?? 0) + 1;
      if (name === "Skill")
        classified.skillInvocations = (classified.skillInvocations ?? 0) + 1;
    }
  }
  tokenUsage.contextInput =
    tokenUsage.input + tokenUsage.cacheCreation + tokenUsage.cacheRead;
  tokenUsage.total = tokenUsage.contextInput + tokenUsage.output;

  return {
    metricStatus: "available",
    tokenUsage,
    toolCalls,
    toolBreakdown,
    classified,
    assistantTurns,
    modelActiveMs:
      timestamps.length >= 2
        ? Math.max(...timestamps) - Math.min(...timestamps)
        : 0,
    transcriptLines: lines.length,
  };
}
