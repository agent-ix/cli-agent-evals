export const SENTINEL_COMPLETE = "<<<EVAL-COMPLETE>>>";
export const SENTINEL_FAILED = "<<<EVAL-FAILED>>>";

export function defaultKickoffLine(): string {
  return "Read ./EVAL_TASK.md and complete the task exactly as instructed.";
}

export function defaultTaskBrief(task: string): string {
  return `# Automated CLI agent eval

${task}

## Completion protocol

Your final action must be one shell command:

- On success: \`echo '${SENTINEL_COMPLETE}'\`
- On failure: \`echo '${SENTINEL_FAILED}'\`

Print exactly one marker and only as the last step.
`;
}
