#!/usr/bin/env bun
/**
 * Aphrody YOLO Backend Rust LTO Build Script
 * Builds native systems crates with Fat LTO and single codegen unit.
 */

import { resolve } from "node:path";

console.log("=== BUILDING YOLO-BACKEND RUST CORE (FAT LTO) ===");

const start = performance.now();

const proc = Bun.spawnSync(["cargo", "build", "--release"], {
  cwd: resolve(import.meta.dir, ".."),
  stdout: "inherit",
  stderr: "inherit",
});

const elapsed = Math.round(performance.now() - start);

if (proc.exitCode !== 0) {
  console.error(`Cargo build exited with code ${proc.exitCode}`);
  process.exit(1);
}

console.log(`Rust LTO build completed successfully in ${elapsed}ms!`);
