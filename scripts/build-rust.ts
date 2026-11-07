#!/usr/bin/env bun
/**
 * Aphrody YOLO Backend Rust LTO Build Script
 * Builds native systems crates with Fat LTO and single codegen unit.
 */

import { resolve, join } from "node:path";
import { copyFileSync, mkdirSync, existsSync } from "node:fs";

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

const metadataProc = Bun.spawnSync(["cargo", "metadata", "--no-deps", "--format-version", "1"], {
  cwd: resolve(import.meta.dir, ".."),
  stdout: "pipe",
});

const metadata = JSON.parse(metadataProc.stdout.toString());
const targetDir = metadata.target_directory;
const binaryName = process.platform === "win32" ? "yolo-backend-core.exe" : "yolo-backend-core";
const builtBinary = join(targetDir, "release", binaryName);

const distDir = resolve(import.meta.dir, "../dist");
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

if (existsSync(builtBinary)) {
  const dest = join(distDir, binaryName);
  copyFileSync(builtBinary, dest);
  console.log(`Copied release binary to ${dest} (${(Bun.file(dest).size / 1024).toFixed(1)} KB)`);
}

console.log(`Rust LTO build completed successfully in ${elapsed}ms!`);
