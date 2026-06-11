// zodecode_change - new file
import { expect, test } from "bun:test"
import { cliCommand } from "../../src/cli/cmd/pr"

test("cliCommand uses the current script when argv[1] is a file path", () => {
  const result = cliCommand({
    execPath: "/usr/bin/node",
    argv: ["/usr/bin/node", "/tmp/zode.js", "pr", "1"],
    exists: (file) => file === "/tmp/zode.js",
  })

  expect(result).toEqual(["/usr/bin/node", "/tmp/zode.js"])
})

test("cliCommand falls back to execPath when argv[1] is a subcommand", () => {
  const result = cliCommand({
    execPath: "/usr/local/bin/zode",
    argv: ["/usr/local/bin/zode", "pr", "1"],
    exists: () => false,
  })

  expect(result).toEqual(["/usr/local/bin/zode"])
})

test("cliCommand ignores subcommand token even when it exists on disk", () => {
  const result = cliCommand({
    execPath: "/usr/local/bin/zode",
    argv: ["/usr/local/bin/zode", "pr", "1"],
    exists: (file) => file === "pr",
  })

  expect(result).toEqual(["/usr/local/bin/zode"])
})

test("cliCommand falls back to execPath when argv[1] is missing", () => {
  const result = cliCommand({
    execPath: "/usr/local/bin/zode",
    argv: ["/usr/local/bin/zode"],
    exists: () => false,
  })

  expect(result).toEqual(["/usr/local/bin/zode"])
})

test("cliCommand falls back to execPath for bun virtual script paths", () => {
  const unix = cliCommand({
    execPath: "/tmp/zode",
    argv: ["/tmp/zode", "/$bunfs/root/src/index.js", "pr", "1"],
    exists: () => true,
  })

  const win = cliCommand({
    execPath: "C:/tmp/zode.exe",
    argv: ["C:/tmp/zode.exe", "B:/~BUN/root/src/index.js", "pr", "1"],
    exists: () => true,
  })

  expect(unix).toEqual(["/tmp/zode"])
  expect(win).toEqual(["C:/tmp/zode.exe"])
})
