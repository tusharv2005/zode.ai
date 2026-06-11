// zodecode_change - new file
//
// Zode uses Npm.Service (arborist) for dependency installation and may write
// a .gitignore inside the .zode config dir. Users may have pnpm or yarn as
// their system package manager, which can produce lockfiles in the .zode/
// config directory. These must be ignored so they don't appear as untracked
// files in the user's project.

import { expect, test } from "bun:test"
import fs from "fs/promises"
import path from "path"
import { Effect, Layer, Option } from "effect"
import { NodeFileSystem, NodePath } from "@effect/platform-node"
import { Config } from "../../src/config/config"
import { EffectFlock } from "@opencode-ai/core/util/effect-flock"
import { Npm } from "@opencode-ai/core/npm"
import { AppFileSystem } from "@opencode-ai/core/filesystem"
import { Env } from "../../src/env"
import { Auth } from "../../src/auth"
import { Account } from "../../src/account/account"
import { WithInstance } from "../../src/project/with-instance"
import { Filesystem } from "../../src/util/filesystem"
import * as CrossSpawnSpawner from "@opencode-ai/core/cross-spawn-spawner"
import { tmpdir } from "../fixture/fixture"

const infra = CrossSpawnSpawner.defaultLayer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
)

const emptyAccount = Layer.mock(Account.Service)({
  active: () => Effect.succeed(Option.none()),
  activeOrg: () => Effect.succeed(Option.none()),
})

const emptyAuth = Layer.mock(Auth.Service)({
  all: () => Effect.succeed({}),
})

const noopNpm = Layer.mock(Npm.Service)({
  install: () => Effect.void,
  add: () => Effect.die("not implemented"),
  which: () => Effect.succeed(Option.none()),
})

const testLayer = Config.layer.pipe(
  Layer.provide(EffectFlock.defaultLayer),
  Layer.provide(AppFileSystem.defaultLayer),
  Layer.provide(Env.defaultLayer),
  Layer.provide(emptyAuth),
  Layer.provide(emptyAccount),
  Layer.provideMerge(infra),
  Layer.provide(noopNpm),
)

test(".gitignore in .zode config dir includes pnpm and yarn lockfile patterns", async () => {
  await using tmp = await tmpdir()
  const dir = path.join(tmp.path, "a")
  const zode = path.join(dir, ".zode")
  await fs.mkdir(zode, { recursive: true })

  await WithInstance.provide({
    directory: dir,
    fn: async () => {
      await Effect.runPromise(Config.Service.use((svc) => svc.get()).pipe(Effect.scoped, Effect.provide(testLayer)))
    },
  })

  const ignore = await Filesystem.readText(path.join(zode, ".gitignore"))
  expect(ignore).toContain("pnpm-lock.yaml")
  expect(ignore).toContain("yarn.lock")
})
