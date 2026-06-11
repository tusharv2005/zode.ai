import type { Argv } from "yargs"
import { cmd } from "@/cli/cmd/cmd"
import { withNetworkOptions, resolveNetworkOptions } from "@/cli/network"
import { AppRuntime } from "@/effect/app-runtime"
import { Daemon } from "@/zodecode/daemon/daemon"

function withJson<T>(yargs: Argv<T>) {
  return yargs.option("json", {
    describe: "print daemon details as JSON",
    type: "boolean",
  })
}

function safe(input: Daemon.State | undefined) {
  if (!input) return undefined
  return {
    pid: input.pid,
    hostname: input.hostname,
    port: input.port,
    url: input.url,
    username: input.username,
    version: input.version,
    startedAt: input.startedAt,
    log: input.log,
  }
}

function print(input: Daemon.Status, json?: boolean) {
  if (json) {
    console.log(
      JSON.stringify(
        {
          ...input,
          state: safe(input.state),
        },
        null,
        2,
      ),
    )
    return
  }
  if (!input.running) {
    console.log(input.stale ? `zode daemon stale: ${input.reason}` : `zode daemon not running`)
    console.log(`state: ${input.file}`)
    if (input.state?.log) console.log(`log: ${input.state.log}`)
    return
  }
  console.log(`zode daemon running`)
  console.log(`url: ${input.state?.url}`)
  console.log(`pid: ${input.state?.pid}`)
  console.log(`version: ${input.health?.version ?? input.state?.version}`)
  console.log(`auth: enabled`)
  console.log(`state: ${input.file}`)
  console.log(`log: ${input.state?.log}`)
}

const StartCommand = cmd({
  command: "start",
  describe: "start the local zode daemon",
  builder: (yargs) => withJson(withNetworkOptions(yargs)),
  handler: async (args) => {
    const opts = await AppRuntime.runPromise(resolveNetworkOptions(args))
    const result = await Daemon.start(opts)
    if (args.json) {
      print(result, true)
      return
    }
    console.log(result.reused ? "zode daemon already running" : "zode daemon started")
    print(result)
  },
})

const StatusCommand = cmd({
  command: "status",
  describe: "show local zode daemon status",
  builder: (yargs) => withJson(yargs),
  handler: async (args) => {
    print(await Daemon.status(), Boolean(args.json))
  },
})

const StopCommand = cmd({
  command: "stop",
  describe: "stop the local zode daemon",
  builder: (yargs) => withJson(yargs),
  handler: async (args) => {
    const result = await Daemon.stop()
    if (args.json) {
      print(result, true)
      return
    }
    console.log(result.stopped ? "zode daemon stopped" : "zode daemon not running")
  },
})

const RestartCommand = cmd({
  command: "restart",
  describe: "restart the local zode daemon",
  builder: (yargs) => withJson(withNetworkOptions(yargs)),
  handler: async (args) => {
    const opts = await AppRuntime.runPromise(resolveNetworkOptions(args))
    const result = await Daemon.restart(opts)
    if (args.json) {
      print(result, true)
      return
    }
    console.log("zode daemon restarted")
    print(result)
  },
})

export const DaemonCommand = cmd({
  command: "daemon",
  describe: "manage the local zode daemon",
  builder: (yargs: Argv) =>
    yargs.command(StartCommand).command(StatusCommand).command(StopCommand).command(RestartCommand).demandCommand(),
  handler: async () => {},
})
