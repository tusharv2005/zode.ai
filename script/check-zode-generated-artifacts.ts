#!/usr/bin/env bun
// zodecode_change - new file

/**
 * Guards generated Zode config dependency artifacts.
 *
 * Zode loads project config from .zode/ and .zodecode/ and installs
 * @zodecode/plugin there at runtime. npm writes package.json, lockfiles,
 * .gitignore, and node_modules as generated local state. These paths must stay
 * untracked so background installs do not create recurring branch diffs.
 */

import { spawnSync } from "node:child_process"

const paths = [
  ".zode/.gitignore",
  ".zode/package.json",
  ".zode/package-lock.json",
  ".zode/pnpm-lock.yaml",
  ".zode/bun.lock",
  ".zode/yarn.lock",
  ".zode/node_modules",
  ".zodecode/.gitignore",
  ".zodecode/package.json",
  ".zodecode/package-lock.json",
  ".zodecode/pnpm-lock.yaml",
  ".zodecode/bun.lock",
  ".zodecode/yarn.lock",
  ".zodecode/node_modules",
]

const git = spawnSync("git", ["ls-files", "-z", "--", ...paths], { encoding: "utf8" })

if (git.status !== 0) {
  console.error(git.stderr.trim() || "git ls-files failed")
  process.exit(1)
}

const bad = git.stdout.split("\0").filter(Boolean).sort()

if (bad.length === 0) {
  console.log("check-zode-generated-artifacts: ok")
  process.exit(0)
}

console.error("Generated Zode config dependency artifacts are tracked:")
for (const file of bad) console.error(`  ${file}`)
console.error("")
console.error("These files are created by runtime dependency installs in .zode/ and .zodecode/.")
console.error("Remove them from git and keep them ignored.")
process.exit(1)
