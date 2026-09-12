#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { main } from "../dist/cli.js";

if (process.argv.length === 3 && process.argv[2] === "--version") {
  const packageFile = new URL("../package.json", import.meta.url);
  const { version } = JSON.parse(readFileSync(packageFile, "utf8"));
  if (typeof version !== "string" || version.length === 0) {
    throw new Error("cli-evals package version is invalid");
  }
  process.stdout.write(`${version}\n`);
} else {
  await main();
}
