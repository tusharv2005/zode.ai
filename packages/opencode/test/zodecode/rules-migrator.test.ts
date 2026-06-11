import { test, expect, describe } from "bun:test"
import { RulesMigrator } from "../../src/zodecode/rules-migrator"
import { tmpdir } from "../fixture/fixture"
import path from "path"
import fs from "fs/promises"

async function withHome<T>(home: string, fn: () => Promise<T>): Promise<T> {
  const prev = process.env.HOME
  const prevTest = process.env.ZODE_TEST_HOME
  process.env.HOME = home
  process.env.ZODE_TEST_HOME = home
  try {
    return await fn()
  } finally {
    if (prev) process.env.HOME = prev
    else delete process.env.HOME
    if (prevTest) process.env.ZODE_TEST_HOME = prevTest
    else delete process.env.ZODE_TEST_HOME
  }
}

describe("RulesMigrator", () => {
  describe("discoverRules", () => {
    test("discovers legacy .zodecoderules file", async () => {
      await using tmp = await tmpdir({
        init: async (dir) => {
          await Bun.write(path.join(dir, ".zodecoderules"), "# Project rules")
        },
      })

      const rules = await RulesMigrator.discoverRules(tmp.path)

      expect(rules).toHaveLength(1)
      expect(rules[0].source).toBe("legacy")
      expect(rules[0].path).toContain(".zodecoderules")
      expect(rules[0].mode).toBeUndefined()
    })

    test("discovers .zode/rules/ directory", async () => {
      await using tmp = await tmpdir({
        init: async (dir) => {
          await fs.mkdir(path.join(dir, ".zode", "rules"), { recursive: true })
          await Bun.write(path.join(dir, ".zode", "rules", "coding.md"), "# Coding rules")
          await Bun.write(path.join(dir, ".zode", "rules", "testing.md"), "# Testing rules")
        },
      })

      const rules = await RulesMigrator.discoverRules(tmp.path)

      expect(rules).toHaveLength(2)
      expect(rules.every((r) => r.source === "project")).toBe(true)
      expect(rules.every((r) => r.mode === undefined)).toBe(true)
    })

    test("discovers rules from legacy .zodecode/rules/", async () => {
      await using tmp = await tmpdir({
        init: async (dir) => {
          await fs.mkdir(path.join(dir, ".zodecode", "rules"), { recursive: true })
          await Bun.write(path.join(dir, ".zodecode", "rules", "legacy.md"), "# Legacy rules")
        },
      })

      const rules = await RulesMigrator.discoverRules(tmp.path)

      expect(rules.some((r) => r.path.includes("legacy.md"))).toBe(true)
    })

    test(".zode/rules/ takes precedence over .zodecode/rules/ for same filename", async () => {
      await using tmp = await tmpdir({
        init: async (dir) => {
          await fs.mkdir(path.join(dir, ".zode", "rules"), { recursive: true })
          await Bun.write(path.join(dir, ".zode", "rules", "main.md"), "# New rules")
          await fs.mkdir(path.join(dir, ".zodecode", "rules"), { recursive: true })
          await Bun.write(path.join(dir, ".zodecode", "rules", "main.md"), "# Old rules")
        },
      })

      const rules = await RulesMigrator.discoverRules(tmp.path)
      const mainRules = rules.filter((r) => r.path.includes("main.md"))

      // Only one main.md should be found (.zode wins)
      expect(mainRules).toHaveLength(1)
      expect(mainRules[0].path).toContain(`.zode${path.sep}`)
    })

    test("discovers mode-specific directory rules", async () => {
      await using tmp = await tmpdir({
        init: async (dir) => {
          await fs.mkdir(path.join(dir, ".zode", "rules-code"), { recursive: true })
          await Bun.write(path.join(dir, ".zode", "rules-code", "style.md"), "# Code style")
        },
      })

      const rules = await RulesMigrator.discoverRules(tmp.path)

      expect(rules).toHaveLength(1)
      expect(rules[0].source).toBe("project")
      expect(rules[0].mode).toBe("code")
    })

    test("discovers mode-specific legacy file", async () => {
      await using tmp = await tmpdir({
        init: async (dir) => {
          await Bun.write(path.join(dir, ".zodecoderules-architect"), "# Architect rules")
        },
      })

      const rules = await RulesMigrator.discoverRules(tmp.path)

      expect(rules).toHaveLength(1)
      expect(rules[0].source).toBe("legacy")
      expect(rules[0].mode).toBe("architect")
    })

    test("ignores non-markdown files in rules directory", async () => {
      await using tmp = await tmpdir({
        init: async (dir) => {
          await fs.mkdir(path.join(dir, ".zode", "rules"), { recursive: true })
          await Bun.write(path.join(dir, ".zode", "rules", "rules.md"), "# Rules")
          await Bun.write(path.join(dir, ".zode", "rules", "notes.txt"), "Notes")
          await Bun.write(path.join(dir, ".zode", "rules", "config.json"), "{}")
        },
      })

      const rules = await RulesMigrator.discoverRules(tmp.path)

      expect(rules).toHaveLength(1)
      expect(rules[0].path).toContain("rules.md")
    })

    test("returns empty array for project without rules", async () => {
      await using tmp = await tmpdir()

      const rules = await RulesMigrator.discoverRules(tmp.path)

      expect(rules).toHaveLength(0)
    })

    test("discovers multiple rule sources together", async () => {
      await using tmp = await tmpdir({
        init: async (dir) => {
          // Legacy file
          await Bun.write(path.join(dir, ".zodecoderules"), "# Legacy rules")
          // Directory rules
          await fs.mkdir(path.join(dir, ".zode", "rules"), { recursive: true })
          await Bun.write(path.join(dir, ".zode", "rules", "main.md"), "# Main rules")
          // Mode-specific
          await Bun.write(path.join(dir, ".zodecoderules-code"), "# Code rules")
        },
      })

      const rules = await RulesMigrator.discoverRules(tmp.path)

      expect(rules).toHaveLength(3)
      expect(rules.some((r) => r.source === "legacy" && !r.mode)).toBe(true)
      expect(rules.some((r) => r.source === "project")).toBe(true)
      expect(rules.some((r) => r.mode === "code")).toBe(true)
    })

    test("discovers global rules from ~/.zode/rules/", async () => {
      await using tmp = await tmpdir({
        init: async (dir) => {
          await fs.mkdir(path.join(dir, ".zode", "rules"), { recursive: true })
          await Bun.write(path.join(dir, ".zode", "rules", "global.md"), "# Global rules")
          await fs.mkdir(path.join(dir, "repo"), { recursive: true })
        },
      })

      const rules = await withHome(tmp.path, () => RulesMigrator.discoverRules(path.join(tmp.path, "repo")))

      expect(
        rules.some((r) => r.source === "global" && r.path.includes(path.join(".zode", "rules", "global.md"))),
      ).toBe(true)
    })
  })

  describe("migrate", () => {
    test("returns instructions array with discovered rules", async () => {
      await using tmp = await tmpdir({
        init: async (dir) => {
          await fs.mkdir(path.join(dir, ".zode", "rules"), { recursive: true })
          await Bun.write(path.join(dir, ".zode", "rules", "main.md"), "# Main rules")
        },
      })

      const result = await RulesMigrator.migrate({ projectDir: tmp.path })

      expect(result.instructions).toHaveLength(1)
      expect(result.instructions[0]).toContain("main.md")
    })

    test("warns about legacy files", async () => {
      await using tmp = await tmpdir({
        init: async (dir) => {
          await Bun.write(path.join(dir, ".zodecoderules"), "# Legacy rules")
        },
      })

      const result = await RulesMigrator.migrate({ projectDir: tmp.path })

      expect(result.warnings.some((w) => w.includes("Legacy"))).toBe(true)
      expect(result.warnings.some((w) => w.includes(".zode/rules/"))).toBe(true)
    })

    test("skips mode-specific rules when includeModeSpecific is false", async () => {
      await using tmp = await tmpdir({
        init: async (dir) => {
          await Bun.write(path.join(dir, ".zodecoderules-code"), "# Code rules")
        },
      })

      const result = await RulesMigrator.migrate({
        projectDir: tmp.path,
        includeModeSpecific: false,
      })

      expect(result.instructions).toHaveLength(0)
      expect(result.warnings.some((w) => w.includes("skipped"))).toBe(true)
    })

    test("includes mode-specific rules by default", async () => {
      await using tmp = await tmpdir({
        init: async (dir) => {
          await Bun.write(path.join(dir, ".zodecoderules-code"), "# Code rules")
        },
      })

      const result = await RulesMigrator.migrate({ projectDir: tmp.path })

      expect(result.instructions).toHaveLength(1)
    })

    test("returns empty result for project without rules", async () => {
      await using tmp = await tmpdir()

      const result = await RulesMigrator.migrate({ projectDir: tmp.path })

      expect(result.instructions).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    test("combines all rule sources", async () => {
      await using tmp = await tmpdir({
        init: async (dir) => {
          await Bun.write(path.join(dir, ".zodecoderules"), "# Legacy")
          await fs.mkdir(path.join(dir, ".zode", "rules"), { recursive: true })
          await Bun.write(path.join(dir, ".zode", "rules", "main.md"), "# Main")
          await Bun.write(path.join(dir, ".zodecoderules-architect"), "# Architect")
        },
      })

      const result = await RulesMigrator.migrate({ projectDir: tmp.path })

      expect(result.instructions).toHaveLength(3)
    })
  })
})
