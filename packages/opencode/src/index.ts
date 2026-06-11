import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { RunCommand } from "./cli/cmd/run"
import { GenerateCommand } from "./cli/cmd/generate"
import * as Log from "@opencode-ai/core/util/log"
// zodecode_change start
// import { LoginCommand, LogoutCommand, SwitchCommand, OrgsCommand } from "./cli/cmd/account"
// import { ConsoleCommand } from "./cli/cmd/account"
// zodecode_change end
import { ConsoleCommand } from "./cli/cmd/account"
import { ProvidersCommand } from "./cli/cmd/providers"
import { AgentCommand } from "./cli/cmd/agent"
import { UpgradeCommand } from "./cli/cmd/upgrade"
import { UninstallCommand } from "./cli/cmd/uninstall"
import { ModelsCommand } from "./cli/cmd/models"
import { UI } from "./cli/ui"
import { Installation } from "./installation"
import { InstallationBuildKind, InstallationVersion } from "@opencode-ai/core/installation/version" // zodecode_change - add InstallationBuildKind
import { NamedError } from "@opencode-ai/core/util/error"
import { FormatError } from "./cli/error"
import { ServeCommand } from "./cli/cmd/serve"
import { Filesystem } from "@/util/filesystem"
import { ConfigCommand as ConfigCLICommand } from "./cli/cmd/config" // zodecode_change
import { DebugCommand } from "./cli/cmd/debug"
import { StatsCommand } from "./cli/cmd/stats"
import { McpCommand } from "./cli/cmd/mcp"
// import { GithubCommand } from "./cli/cmd/github" // zodecode_change
import { ExportCommand } from "./cli/cmd/export"
import { ImportCommand } from "./cli/cmd/import"
import { AttachCommand } from "./cli/cmd/tui/attach"
import { TuiThreadCommand } from "./cli/cmd/tui/thread"
import { AcpCommand } from "./cli/cmd/acp"
import { EOL } from "os"
// import { WebCommand } from "./cli/cmd/web" // zodecode_change (Disabled unsupported opencode web UI)
import { PrCommand } from "./cli/cmd/pr"
import { SessionCommand } from "./cli/cmd/session"
import { RemoteCommand } from "./cli/cmd/remote" // zodecode_change
import { RollCallCommand } from "./zodecode/cli/cmd/roll-call" // zodecode_change
import { ProfileCommand } from "./zodecode/cli/cmd/profile" // zodecode_change
import { DevSetupCommand, DevAliasCommand } from "./zodecode/cli/dev-setup" // zodecode_change
import { DaemonCommand } from "./zodecode/cli/cmd/daemon" // zodecode_change
import { ZodeConsoleCommand } from "./zodecode/cli/cmd/console" // zodecode_change
// zodecode_change start - Import telemetry, instance disposal, and legacy migration
import { Telemetry } from "@zodecode/zode-telemetry"
import { InstanceRuntime } from "./project/instance-runtime" // zodecode_change
import { migrateLegacyZodeAuth, ENV_FEATURE, ENV_VERSION } from "@zodecode/zode-gateway"
import { SessionExport } from "./zodecode/session-export" // zodecode_change

// zodecode_change - set feature for tracking. 'serve' is spawned by other services
// (extension, cloud) which set their own ZODECODE_FEATURE env var. Direct CLI use
// (any command other than 'serve') is tagged as 'cli'. If 'serve' is spawned without
// the env var, it gets 'unknown' so the misconfiguration is visible in data.
if (!process.env[ENV_FEATURE]) {
  const isServe = process.argv.includes("serve")
  process.env[ENV_FEATURE] = isServe ? "unknown" : "cli"
}

// zodecode_change - set version so zode-gateway can include it in the editor name header
if (!process.env[ENV_VERSION]) {
  process.env[ENV_VERSION] = InstallationVersion
}
import { Config } from "./config/config"
import { AppRuntime } from "./effect/app-runtime"
import { Auth } from "./auth"
// zodecode_change end
import { DbCommand } from "./cli/cmd/db"
import path from "path"
import { Global } from "@opencode-ai/core/global"
import { createHelpCommand } from "./zodecode/help-command" // zodecode_change
import { JsonMigration } from "@/storage/json-migration"
import { Database } from "@/storage/db"
import { errorMessage } from "./util/error"
import { PluginCommand } from "./cli/cmd/plug"
import { Heap } from "./cli/heap"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { ensureProcessMetadata } from "@opencode-ai/core/util/opencode-process"

const processMetadata = ensureProcessMetadata("main")

process.on("unhandledRejection", (e) => {
  Log.Default.error("rejection", {
    e: errorMessage(e),
  })
})

process.on("uncaughtException", (e) => {
  Log.Default.error("exception", {
    e: errorMessage(e),
  })
})

const args = hideBin(process.argv)

function show(out: string) {
  const text = out.trimStart()
  const end = out.endsWith(EOL) ? "" : EOL // zodecode_change - keep shell prompt on the next line
  if (!text.startsWith("opencode ")) {
    process.stderr.write(UI.logo() + EOL + EOL)
    process.stderr.write(text + end) // zodecode_change
    return
  }
  process.stderr.write(out + end) // zodecode_change
}

let cli = yargs(args) // zodecode_change
  .parserConfiguration({ "populate--": true })
  .scriptName("zode") // zodecode_change
  .wrap(100)
  .help("help", "show help")
  .alias("help", "h")
  .version("version", "show version number", InstallationVersion)
  .alias("version", "v")
  .option("print-logs", {
    describe: "print logs to stderr",
    type: "boolean",
  })
  .option("log-level", {
    describe: "log level",
    type: "string",
    choices: ["DEBUG", "INFO", "WARN", "ERROR"],
  })
  .option("pure", {
    describe: "run without external plugins",
    type: "boolean",
  })
  .middleware(async (opts) => {
    if (opts.pure) {
      process.env.ZODE_PURE = "1"
    }

    await Log.init({
      print: process.argv.includes("--print-logs"),
      dev: Installation.isLocal(),
      level: (() => {
        if (opts.logLevel) return opts.logLevel as Log.Level
        if (Installation.isLocal()) return "DEBUG"
        return "INFO"
      })(),
    })

    Heap.start()

    process.env.AGENT = "1"
    process.env.ZODE = "1" // zodecode_change
    process.env.ZODE_PID = String(process.pid)

    Log.Default.info("opencode", {
      version: InstallationVersion,
      args: process.argv.slice(2),
      process_role: processMetadata.processRole,
      run_id: processMetadata.runID,
    })

    // zodecode_change start - Initialize telemetry
    const globalCfg = await AppRuntime.runPromise(Config.Service.use((cfg) => cfg.getGlobal()))
    await Telemetry.init({
      dataPath: Global.Path.data,
      version: InstallationVersion,
      enabled: globalCfg.experimental?.openTelemetry !== false,
    })

    // Migrate legacy Zode CLI auth if needed
    await migrateLegacyZodeAuth(
      async () => (await AppRuntime.runPromise(Auth.Service.use((svc) => svc.get("zode")))) !== undefined,
      async (auth) => AppRuntime.runPromise(Auth.Service.use((svc) => svc.set("zode", auth))),
    )

    const zodeAuth = await AppRuntime.runPromise(Auth.Service.use((svc) => svc.get("zode")))
    if (zodeAuth) {
      const token = zodeAuth.type === "oauth" ? zodeAuth.access : zodeAuth.key
      const accountId = zodeAuth.type === "oauth" ? zodeAuth.accountId : undefined
      await Telemetry.updateIdentity(token, accountId)
    }

    Telemetry.trackCliStart()
    // zodecode_change end

    // zodecode_change start - one-time database migration progress
    const marker = path.join(Global.Path.data, "zode.db")
    if (!(await Filesystem.exists(marker))) {
      const tty = process.stderr.isTTY
      process.stderr.write("Performing one time database migration, may take a few minutes..." + EOL)
      const width = 36
      const orange = "\x1b[38;5;214m"
      const muted = "\x1b[0;2m"
      const reset = "\x1b[0m"
      let last = -1
      if (tty) process.stderr.write("\x1b[?25l")
      try {
        await JsonMigration.run(drizzle({ client: Database.Client().$client }), {
          progress: (event) => {
            const percent = Math.floor((event.current / event.total) * 100)
            if (percent === last && event.current !== event.total) return
            last = percent
            if (tty) {
              const fill = Math.round((percent / 100) * width)
              const bar = `${"■".repeat(fill)}${"･".repeat(width - fill)}`
              process.stderr.write(
                `\r${orange}${bar} ${percent.toString().padStart(3)}%${reset} ${muted}${event.label.padEnd(12)} ${event.current}/${event.total}${reset}`,
              )
              if (event.current === event.total) process.stderr.write("\n")
            } else {
              process.stderr.write(`sqlite-migration:${percent}${EOL}`)
            }
          },
        })
      } finally {
        if (tty) process.stderr.write("\x1b[?25h")
        else {
          process.stderr.write(`sqlite-migration:done${EOL}`)
        }
      }
      process.stderr.write("Database migration complete." + EOL)
    }
    // zodecode_change end
  })
  .usage("")
  .completion("completion", "generate shell completion script")
  .command(AcpCommand)
  .command(McpCommand)
  .command(TuiThreadCommand)
  .command(AttachCommand)
  .command(RunCommand)
  .command(GenerateCommand)
  .command(DebugCommand)
  // zodecode_change start
  // .command(LoginCommand)
  // .command(LogoutCommand)
  // .command(SwitchCommand)
  // .command(OrgsCommand)
  // .command(ConsoleCommand)
  // zodecode_change end
  .command(ProvidersCommand)
  .command(AgentCommand)
  .command(UpgradeCommand)
  .command(UninstallCommand)
  .command(ServeCommand)
  // .command(WebCommand) // zodecode_change (Disabled unsupported opencode web UI)
  .command(ModelsCommand)
  .command(RollCallCommand) // zodecode_change
  .command(ProfileCommand) // zodecode_change
  .command(StatsCommand)
  .command(ExportCommand)
  .command(ImportCommand)
  // .command(GithubCommand) // zodecode_change (Disabled until backend is ready)
  .command(PrCommand)
  .command(SessionCommand)
  .command(RemoteCommand) // zodecode_change
  .command(DaemonCommand) // zodecode_change
  .command(ZodeConsoleCommand) // zodecode_change
  .command(ConfigCLICommand) // zodecode_change
  .command(PluginCommand)
  .command(DbCommand)

// zodecode_change start - dev-only commands are hidden from release builds
if (InstallationBuildKind !== "release") {
  cli = cli.command(DevSetupCommand).command(DevAliasCommand)
}
// zodecode_change end

// zodecode_change start - registered after initial chain to avoid self-referential type error
cli = cli.command(createHelpCommand(() => cli))

cli = cli
  // zodecode_change end
  .fail((msg, err) => {
    if (
      msg?.startsWith("Unknown argument") ||
      msg?.startsWith("Not enough non-option arguments") ||
      msg?.startsWith("Invalid values:")
    ) {
      if (err) throw err
      cli.showHelp(show)
    }
    if (err) throw err
    process.exit(1)
  })
  .strict()

try {
  if (args.includes("-h") || args.includes("--help")) {
    await cli.parse(args, (err: Error | undefined, _argv: unknown, out: string) => {
      if (err) throw err
      if (!out) return
      show(out)
    })
  } else {
    await cli.parse()
  }
} catch (e) {
  let data: Record<string, any> = {}
  if (e instanceof NamedError) {
    const obj = e.toObject()
    Object.assign(data, {
      ...obj.data,
    })
  }

  if (e instanceof Error) {
    Object.assign(data, {
      name: e.name,
      message: e.message,
      cause: e.cause?.toString(),
      stack: e.stack,
    })
  }

  // zodecode_change start - log extra Bun resolve metadata for startup failures
  if (e instanceof ResolveMessage) {
    Object.assign(data, {
      name: e.name,
      message: e.message,
      code: e.code,
      specifier: e.specifier,
      referrer: e.referrer,
      position: e.position,
      importKind: e.importKind,
    })
  }
  // zodecode_change end
  Log.Default.error("fatal", data) // zodecode_change
  const formatted = FormatError(e)
  if (formatted) UI.error(formatted)
  if (formatted === undefined) {
    UI.error("Unexpected error, check log file at " + Log.file() + " for more details" + EOL) // zodecode_change
    process.stderr.write(errorMessage(e) + EOL)
  }
  process.exitCode = 1
} finally {
  // zodecode_change start - Track CLI exit and shutdown telemetry
  const exitCode = typeof process.exitCode === "number" ? process.exitCode : undefined
  Telemetry.trackCliExit(exitCode)
  await SessionExport.shutdown()
  await Telemetry.shutdown()
  // zodecode_change end

  await InstanceRuntime.disposeAllInstances() // zodecode_change - safety net disposal (no-op if already disposed)

  // Some subprocesses don't react properly to SIGTERM and similar signals.
  // Most notably, some docker-container-based MCP servers don't handle such signals unless
  // run using `docker run --init`.
  // Explicitly exit to avoid any hanging subprocesses.
  process.exit() // zodecode_change
}
