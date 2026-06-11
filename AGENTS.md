# AGENTS.md

Zode CLI is an open source AI coding agent that generates code from natural language, automates tasks, and supports 500+ AI models.

- ALWAYS USE PARALLEL TOOLS WHEN APPLICABLE.
- The default branch in this repo is `main`.
- Prefer automation: execute requested actions without confirmation unless blocked by missing info or safety/irreversibility.
- You may be running in a git worktree. All changes must be made in your current working directory — never modify files in the main repo checkout.

## Build and Dev

- **Dev**: `bun run dev` (runs from root) or `bun run --cwd packages/opencode --conditions=browser src/index.ts`
- **Dev with params**: `bun dev -- help`
- **Extension**: `bun run extension` (build + launch VS Code with the extension in dev mode). Pass `--no-build` to skip the build.
- **Typecheck**: `bun turbo typecheck` (uses `tsgo`, not `tsc`). Includes the JetBrains plugin — requires Java 21. Check with `java -version` before running. If missing, install via SDKMAN: `sdk install java 21-tem && sdk use java 21-tem`. If SDKMAN is not installed, see https://sdkman.io/install.
- **Test**: `bun test` from `packages/opencode/` (NOT from root -- root blocks tests)
- **Single test**: `bun test ./test/tool/tool-define.test.ts` from `packages/opencode/`
- **CLI build artifact size check**: after `bun run script/build.ts --single --skip-install` in `packages/opencode/`, use `du -h dist/*/*/bin/zode` (scoped package output lives under `dist/@zodecode/`)
- **SDK regen**: After changing server endpoints in `packages/opencode/src/server/`, run `./script/generate.ts` from root to regenerate `packages/sdk/js/`
- **Knip** (unused exports): `bun run knip` from `packages/zode-vscode/`. CI runs this — all exported types/functions must be imported somewhere. Remove or unexport unused exports before pushing.
- **Source links**: After adding or changing URLs in `packages/zode-vscode/`, `packages/zode-vscode/webview-ui/`, or `packages/opencode/src/`, run `bun run script/extract-source-links.ts` from the repo root and commit the updated `packages/zode-docs/source-links.md`. CI runs this check — the build fails if the file is stale.
- **zodecode_change check**: `bun run check-zodecode-change` from `packages/zode-vscode/`. CI runs this — `zodecode_change` is a marker for upstream merge conflicts and must not appear in `packages/zode-vscode/` or `packages/zode-ui/` (these are entirely Zode Code additions). Remove the markers before pushing.
- **opencode annotation check**: `bun run script/check-opencode-annotations.ts` from repo root. CI runs this on PRs touching `packages/opencode/` — every Zode-specific change in shared opencode files must be annotated with `zodecode_change` markers. Exempt paths (no markers needed): `packages/opencode/src/zodecode/`, `packages/opencode/test/zodecode/`, and any path containing `zodecode` in the name.
- **Effect facade ratchet**: Do not add runtime-backed Promise facades to shared `packages/opencode/src` Effect services; use service dependencies, `AppRuntime`, or Zode-owned boundaries. Run `bun run script/check-opencode-promise-facades.ts` when touching service adapters.
- **workflow allowlist**: `bun run script/check-workflows.ts` from repo root. CI runs this as part of the annotations workflow — any `.yml` / `.yaml` file added to or removed from `.github/workflows/` must be reflected in the hardcoded list in `script/check-workflows.ts`. Prevents upstream-merged workflows from silently starting to run in our CI.
- **Backend/SDK programmatic testing**: see [TESTING.md](./TESTING.md) for spawning the local main-branch backend (`bun dev serve`) and driving it via `curl` — use this instead of `zode serve` (prod binary) when testing backend fixes.

## Quality Checks

Before saying an implementation is ready, run the smallest relevant checks that can catch lint, typecheck, and test failures for the touched package. Do not rely on manual extension launch to discover build problems. Fix failures you introduced before the final response, or state exactly which check is still failing or could not be run.

| Area | Checks |
|---|---|
| Root / cross-package | `bun run lint`, `bun run typecheck` |
| CLI | From `packages/opencode/`: `bun run typecheck`, `bun test` or targeted `bun test ./path/to/file.test.ts` |
| VS Code extension | From `packages/zode-vscode/`: `bun run typecheck`, `bun run lint`, `bun run test:unit` or `bun run test` |
| Extension build/package | From `packages/zode-vscode/`: `bun run compile` or `bun run package` when touching build, packaging, SDK, or webview integration paths |
| JetBrains plugin | From `packages/zode-jetbrains/`: `./gradlew typecheck`, `./gradlew test`. Requires Java 21 — check first with `java -version`. Install via SDKMAN if missing: `sdk install java 21-tem && sdk use java 21-tem`. |
| CI-only guards | Run affected guards documented above, such as `bun run knip`, `bun run check-zodecode-change`, `bun run script/check-opencode-annotations.ts`, or source link extraction |

Never run root `bun test`; the root script prints `do not run tests from root` and exits with code 1. Use package-level tests instead.

## Products

All products are clients of the **CLI** (`packages/opencode/`), which contains the AI agent runtime, HTTP server, and session management. Each client spawns or connects to a `zode serve` process and communicates via HTTP + SSE using `@zodecode/sdk`.

| Product | Package | Description |
|---|---|---|
| Zode CLI | `packages/opencode/` | Core engine. TUI, `zode run`, `zode serve`. Fork of upstream OpenCode. |
| Zode VS Code Extension | `packages/zode-vscode/` | VS Code extension. Bundles the CLI binary, spawns `zode serve` as a child process. Includes the **Agent Manager** — a multi-session orchestration panel with git worktree isolation. |

**Agent Manager** refers to a feature inside `packages/zode-vscode/` (extension code in `src/agent-manager/`, webview in `webview-ui/agent-manager/`). It is not a standalone product. See the extension's `AGENTS.md` for details.

In each VS Code extension host, one `ZodeConnectionService` is created for the sidebar, every Zode editor tab, and Agent Manager; it lazily starts and reuses one current `zode serve` backend at a time. Agent Manager worktree sessions pass a directory context to this shared backend rather than starting one per worktree. State captured by the active service layer, such as Snapshot `trackState`, is shared across those requests; only directory-keyed `InstanceState` data is isolated.

Extension-specific settings should live in the Zode extension settings, not default VS Code settings, unless they are intentionally VS Code-wide.

## Package Instructions

- When a task primarily touches `packages/zode-jetbrains/`, read `packages/zode-jetbrains/AGENTS.md` before planning or editing. It covers split-mode architecture, IntelliJ source lookup, threading fundamentals, UI guidelines, and session component architecture.

## Monorepo Structure

Turborepo + Bun workspaces. The packages you'll work with most:

| Package | Name | Purpose |
|---|---|---|
| `packages/opencode/` | `@zodecode/cli` | Core CLI -- agents, tools, sessions, server, TUI. This is where most work happens. |
| `packages/sdk/js/` | `@zodecode/sdk` | Auto-generated TypeScript SDK (client for the server API). Do not edit `src/gen/` by hand. |
| `packages/zode-vscode/` | `zode-code` | VS Code extension with sidebar chat + Agent Manager. See its own `AGENTS.md` for details. |
| `packages/zode-gateway/` | `@zodecode/zode-gateway` | Zode auth, provider routing, API integration |
| `packages/zode-telemetry/` | `@zodecode/zode-telemetry` | PostHog analytics + OpenTelemetry |
| `packages/zode-i18n/` | `@zodecode/zode-i18n` | Internationalization / translations |
| `packages/zode-ui/` | `@zodecode/zode-ui` | SolidJS component library shared by the extension webview and docs screenshot stories |
| `packages/util/` | `@opencode-ai/util` | Shared utilities (error, path, retry, slug, etc.) |
| `packages/plugin/` | `@zodecode/plugin` | Plugin/tool interface definitions |

## Style Guide

- Keep things in one function unless composable or reusable
- Avoid unnecessary destructuring. Instead of `const { a, b } = obj`, use `obj.a` and `obj.b` to preserve context
- Avoid `try`/`catch` where possible
- Avoid using the `any` type
- Prefer single word variable names where possible
- Use Bun APIs when possible, like `Bun.file()`
- Rely on type inference when possible; avoid explicit type annotations or interfaces unless necessary for exports or clarity

### Avoid let statements

Prefer `const`. Replace `let` + if/else assignment with a ternary or an IIFE. Reassignment is the only legitimate reason to reach for `let`.

### Naming Enforcement (Read This)

THIS RULE IS MANDATORY FOR AGENT WRITTEN CODE.

- Use single word names by default for new locals, params, and helper functions.
- Multi-word names are allowed only when a single word would be unclear or ambiguous.
- Do not introduce new camelCase compounds when a short single-word alternative is clear.
- Before finishing edits, review touched lines and shorten newly introduced identifiers where possible.
- Good short names to prefer: `pid`, `cfg`, `err`, `opts`, `dir`, `root`, `child`, `state`, `timeout`.
- Examples to avoid unless truly required: `inputPID`, `existingClient`, `connectTimeout`, `workerPath`.

### Avoid else statements

Prefer early returns (or an IIFE) over `else`. After an `if` that returns/throws, the `else` is redundant.

### No empty catch blocks

Never leave a `catch` block empty. An empty `catch` silently swallows errors and hides bugs. If you're tempted to write one, ask yourself:

1. Is the `try`/`catch` even needed? (prefer removing it)
2. Should the error be handled explicitly? (recover, retry, rethrow)
3. At minimum, log it via `log.error("...", { err })` so failures are visible — never `catch {}` or `catch (e) {}` with no body.

### Prefer single word naming

Default to a single-word name for variables, parameters, and helper functions. Reach for a multi-word name only when a single word would be genuinely ambiguous in context — not just because the longer name "reads nicer". The rule is about meaning, not character count: don't introduce camelCase compounds like `inputPID`, `existingClient`, `connectTimeout`, or `workerPath` when `pid`, `client`, `timeout`, or `path` is already clear from the surrounding code. See the "Naming Enforcement" section above for the preferred vocabulary.

## Testing

You MUST avoid using `mocks` as much as possible.
Tests MUST test actual implementation, do not duplicate logic into a test.

## Markdown Tables

Do not pad markdown table cells for column alignment. Use the compact form with single-space-padded content cells and a minimal separator row:

```
| Command | What it runs |
|---|---|
| `zode serve` | The prod CLI on `$PATH`. |
```

Do **not** right-pad cells to line up columns:

```
| Command                       | What it runs             |
| ----------------------------- | ------------------------ |
| `zode serve`                  | The prod CLI on `$PATH`. |
```

Padding makes every content change rewrite the entire table, which blows up diffs on untouched rows. Markdown files are excluded from prettier (see `.prettierignore`) so running the formatter won't re-pad them, and `script/check-md-table-padding.ts` enforces the rule in CI. Run `bun run script/check-md-table-padding.ts --fix` to auto-rewrite padded tables.

## Commit Conventions

[Conventional Commits](https://www.conventionalcommits.org/) with scopes matching packages: `vscode`, `cli`, `agent-manager`, `sdk`, `ui`, `i18n`, `zode-docs`, `gateway`, `telemetry`, `desktop`. Omit scope when spanning multiple packages.

## Changesets

User-facing changes (features, fixes, breaking changes) require a changeset file for release notes. Run `bunx changeset add` or manually create `.changeset/<slug>.md`. Use `patch` for bug fixes, `minor` for new features, `major` for breaking changes. See `.changeset/README.md` for details.

Changeset descriptions appear directly in release notes and are read by end users. Keep them concise and feature-oriented — describe **what changed from the user's perspective**, not implementation details. Write in imperative mood (e.g. "Support exporting conversations as markdown" not "Add a new export handler that serializes session messages to .md files").

## Pull Requests

PR descriptions should explain **what** changed, **why** the change is needed, and the intent or constraints a reviewer cannot infer from the diff alone. Keep simple PRs brief, but give non-trivial changes enough context to stand on their own. Skip file-by-file inventories, test result summaries, and anything obvious from the code itself.

## GitHub Issues

When creating or managing GitHub issues for the VS Code extension or JetBrains plugin via `gh`, load `.zode/skills/gh-issues/SKILL.md`. It covers templates, project boards (`VS Code Extension`, `Jetbrains Plugin`), title conventions, and the `gh auth refresh -s project` recovery path.

## Fork Merge Process

Zode CLI is a fork of [opencode](https://github.com/anomalyco/opencode).

**Very important**: when planning or coding, update shared files with OpenCode as last resort! Everything is shared code from OpenCode, except folders that contain `zode` in the name or have a parent directory that contains `zode` in the name. Example of zode specific folders: `packages/opencode/src/zodecode/` and `packages/zode-docs/`. Always look for ways to implement your feature or fix in a way that minimizes changes to shared code.

### Minimizing Merge Conflicts

We regularly merge upstream changes from opencode. To minimize merge conflicts and keep the sync process smooth:

1. **Prefer `zodecode` directories** - Place Zode-specific code in dedicated directories whenever possible:
   - `packages/opencode/src/zodecode/` - Zode-specific source code
   - `packages/opencode/test/zodecode/` - Zode-specific tests
   - `packages/zode-gateway/` - The Zode Gateway package

2. **Minimize changes to shared files** - When you must modify files that exist in upstream opencode, keep changes as small and isolated as possible.

3. **Use `zodecode_change` markers** - When modifying shared code, mark your changes with `zodecode_change` comments so they can be easily identified during merges.
   Do not use these markers in files within directories with zode in the name

4. **Avoid restructuring upstream code** - Don't refactor or reorganize code that comes from opencode unless absolutely necessary.

5. **Mirror new config keys to the cloud schema** - When adding a `zodecode_change` key to `Config.Info` in `packages/opencode/src/config/config.ts`, also add the matching JSON Schema entry in `apps/web/src/app/config.json/extras.ts` in the [cloud repo](https://github.com/Zode-Org/cloud). See [CLI Config Schema](packages/zode-docs/pages/contributing/architecture/config-schema.md) for the step-by-step.

The goal is to keep our diff from upstream as small as possible, making regular merges straightforward and reducing the risk of conflicts.

### Git conflict style

`bun install` sets `merge.conflictStyle=zdiff3` repo-locally via `script/setup-git.ts` (wired into `postinstall`). Conflicts include the common ancestor between `|||||||` and `=======`, which is what `script/upstream/` and `mergiraf` rely on for structural resolution and what makes manual resolution on shared opencode files tractable. If you've overridden it in your user config, the repo-local setting takes precedence — don't override it back.

### Zodecode Change Markers

When editing shared upstream files, mark Zode-specific lines with `zodecode_change` comments so future merges can find them. The basic forms are:

- Single line: `const value = 42 // zodecode_change`
- Multi-line block: wrap with `// zodecode_change start` / `// zodecode_change end`
- New file in a shared path: `// zodecode_change - new file` at the top
- JSX/TSX: use `{/* zodecode_change */}` (and `{/* zodecode_change start */}` / `end`)

Markers are NOT needed in paths that contain `zodecode` in the name (e.g. `packages/opencode/src/zodecode/`, `packages/opencode/test/zodecode/`) — these are entirely Zode Code additions and won't conflict with upstream.

For decision rules on when to keep changes inline vs. extract Zode logic, marker placement guidance, and verification commands, load `.zode/skills/zodecode-merge-minimizer/SKILL.md`.
