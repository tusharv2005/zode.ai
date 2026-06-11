# Zodecode Rules Migration

This document explains how Zodecode rules are automatically migrated to Opencode's `instructions` config array.

## Overview

Zodecode stores rules in various file locations. When Opencode starts, it reads these files and injects their paths into the `instructions` config array, which Opencode then loads as part of the system prompt.

## Key Guarantees

### 1. Read-Only Migration

The migration **never modifies project files**. We only:

- Read existing rule files from disk
- Inject file paths into the config's `instructions` array
- Never write to the project or modify any files

### 2. Combines with Existing Config (Never Overwrites)

If you have existing opencode config with `instructions`, the Zodecode rules are **combined**, not replaced:

```typescript
// Example: User has opencode.json with:
{ "instructions": ["AGENTS.md", "custom-rules.md"] }

// Zodecode rules add:
{ "instructions": [".zodecoderules", ".zodecode/rules/coding.md"] }

// Result (combined, deduplicated):
{ "instructions": ["AGENTS.md", "custom-rules.md", ".zodecoderules", ".zodecode/rules/coding.md"] }
```

### 3. Restart to Pick Up Changes

If you change your Zodecode configuration (e.g., edit `.zodecoderules`), simply restart zode-cli to pick up the new config. No manual migration or conversion needed.

## Source Locations

The migrator reads rules from these locations:

### Project Rules

| Location | Description |
|---|---|
| `.zodecoderules` | Legacy single-file rules in project root |
| `.zodecode/rules/*.md` | Directory-based rules (multiple markdown files) |
| `.zodecoderules-{mode}` | Mode-specific legacy rules (e.g., `.zodecoderules-code`) |
| `.zodecode/rules-{mode}/*.md` | Mode-specific rule directories |

### Global Rules

| Location | Description |
|---|---|
| `~/.zodecode/rules/*.md` | Global rules directory |

## File Mapping

| Zodecode Location | Opencode Equivalent |
|---|---|
| `.zodecoderules` | `instructions: [".zodecoderules"]` |
| `.zodecoderules-{mode}` | `instructions: [".zodecoderules-{mode}"]` |
| `.zodecode/rules/*.md` | `instructions: [".zodecode/rules/file.md", ...]` |
| `.zodecode/rules-{mode}/*.md` | `instructions: [".zodecode/rules-{mode}/file.md", ...]` |
| `~/.zodecode/rules/*.md` | `instructions: ["~/.zodecode/rules/file.md", ...]` |

## AGENTS.md Compatibility

`AGENTS.md` is loaded **natively** by Opencode - no migration needed. Opencode automatically loads:

- `AGENTS.md` in project root
- `CLAUDE.md` in project root
- `~/.opencode/AGENTS.md` (global)

## Not Migrated

The following are **not** migrated:

- `.roorules` - Roo-specific rules
- `.clinerules` - Cline-specific rules

Only Zodecode-specific files (`.zodecoderules`, `.zodecode/rules/`) are migrated.

## Mode-Specific Rules

Mode-specific rules (e.g., `.zodecoderules-code`, `.zodecode/rules-architect/`) are included by default. All mode-specific rules are loaded regardless of the current mode.

## Warnings

The migrator generates warnings for:

- **Legacy files**: When `.zodecoderules` is found, a warning suggests migrating to `.zodecode/rules/` directory structure

## Example

### Before (Zodecode)

```
project/
├── .zodecoderules           # Legacy rules
├── .zodecoderules-code      # Code-mode specific
└── .zodecode/
    └── rules/
        ├── coding.md        # Coding standards
        └── testing.md       # Testing guidelines
```

### After (Opencode Config)

```json
{
  "instructions": [
    "/path/to/project/.zodecode/rules/coding.md",
    "/path/to/project/.zodecode/rules/testing.md",
    "/path/to/project/.zodecoderules",
    "/path/to/project/.zodecoderules-code"
  ]
}
```

## Troubleshooting

### Rules not appearing

1. Check the file exists at the expected location
2. Ensure markdown files have `.md` extension
3. Restart zode-cli to pick up changes

### Duplicate rules

The `mergeConfigConcatArrays` function automatically deduplicates the `instructions` array using `Array.from(new Set([...]))`.

## Related Files

- [`rules-migrator.ts`](../rules-migrator.ts) - Core migration logic
- [`config-injector.ts`](../config-injector.ts) - Config building and injection
- [`modes-migration.md`](./modes-migration.md) - Modes migration documentation
