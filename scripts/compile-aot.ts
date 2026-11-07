#!/usr/bin/env bun
/**
 * Aphrody YOLO Backend Bun Ahead-of-Time (AoT) Compiler Script
 * Compiles TypeScript/Hono into a standalone native binary with bytecode pre-compilation and dead-code trimming.
 */

import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

console.log("=== COMPILING YOLO-BACKEND VIA BUN AOT (CANARY) ===");

if (!existsSync("dist")) {
  mkdirSync("dist", { recursive: true });
}

const outfile = resolve("dist", process.platform === "win32" ? "yolo-backend.exe" : "yolo-backend");

const start = performance.now();

const proc = Bun.spawnSync([
  "bun",
  "build",
  "--compile",
  "--minify",
  "--bytecode",
  "src/index.ts",
  "--outfile",
  outfile,
]);

const elapsed = Math.round(performance.now() - start);

if (proc.exitCode !== 0) {
  console.error("AoT Compilation failed:");
  console.error(new TextDecoder().decode(proc.stderr));
  process.exit(1);
}

const sizeBytes = Bun.file(outfile).size;
const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(2);

console.log(`Compilation successful in ${elapsed}ms!`);
console.log(`Binary output: ${outfile} (${sizeMb} MB)`);
