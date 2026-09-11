import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export interface TranscriptCapture {
  digest: string | null;
  metricsPath?: string;
  path?: string;
  retention: "retained" | "not-retained" | "unavailable";
}

export function captureTranscript(
  workDir: string,
  sourcePath: string | undefined,
  keep: boolean,
): TranscriptCapture {
  if (!sourcePath) return unavailableCapture();

  try {
    const bytes = readFileSync(sourcePath);
    const digest = createHash("sha256").update(bytes).digest("hex");
    const relativePath = `.cli-agent-evals/transcripts/${digest}.transcript`;
    const snapshotPath = join(workDir, ...relativePath.split("/"));
    mkdirSync(dirname(snapshotPath), { recursive: true });
    writeSnapshot(snapshotPath, bytes);
    return {
      digest,
      metricsPath: snapshotPath,
      path: keep ? relativePath : undefined,
      retention: keep ? "retained" : "not-retained",
    };
  } catch {
    return unavailableCapture();
  }
}

function writeSnapshot(path: string, bytes: Buffer): void {
  try {
    writeFileSync(path, bytes, { flag: "wx", mode: 0o400 });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? error.code
        : undefined;
    if (code !== "EEXIST" || !readFileSync(path).equals(bytes)) throw error;
  }
}

function unavailableCapture(): TranscriptCapture {
  return { digest: null, retention: "unavailable" };
}
