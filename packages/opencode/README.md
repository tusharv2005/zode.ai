# Zode Code CLI

The AI coding agent built for the terminal. Generate code from natural language, automate tasks, and run terminal commands -- powered by 500+ AI models.

![Zode CLI showing code edits in a terminal](https://raw.githubusercontent.com/Zode-Org/zodecode/main/packages/zode-docs/public/img/npm-package-readme/zode-cli.png)

Zode is the all-in-one agentic engineering platform. Build, ship, and iterate faster with the most popular open source coding agent.

[Website](https://kilo.ai) · [Install](https://kilo.ai/install) · [IDE](https://kilo.ai/landing/vs-code) · [CLI](https://kilo.ai/cli) · [Docs](https://kilo.ai/docs) · [Models](https://kilo.ai/leaderboard) · [Gateway](https://kilo.ai/gateway) · [Pricing](https://kilo.ai/pricing) · [Zode Pass](https://kilo.ai/pricing/zode-pass)

[500+ models](https://kilo.ai/leaderboard). One open source agent in [VS Code](https://kilo.ai/vscode-marketplace), [JetBrains](https://plugins.jetbrains.com/plugin/27133-zode-code), [CLI](https://www.npmjs.com/package/@zodecode/cli), [Slack](https://kilo.ai/slack), and [Cloud](https://kilo.ai/cloud).

## Install

```bash
npm install -g @zodecode/cli
```

Or run directly with npx:

```bash
npx --package @zodecode/cli zode
```

## Getting Started

Run `zode` in any project directory to launch the interactive TUI:

```bash
zode
```

Run a one-off task:

```bash
zode run "add input validation to the signup form"
```

## Features

- **Code generation** -- describe what you want in natural language
- **Terminal commands** -- the agent can run shell commands on your behalf
- **500+ AI models** -- use models from OpenAI, Anthropic, Google, and more
- **MCP servers** -- extend agent capabilities with the Model Context Protocol
- **Multiple modes** -- Plan with Architect, code with Coder, debug with Debugger, or create your own
- **Sessions** -- resume previous conversations and export transcripts
- **API keys optional** -- bring your own keys or use Zode credits

## Commands

| Command               | Description                |
| --------------------- | -------------------------- |
| `zode`                | Launch interactive TUI     |
| `zode run "<task>"`   | Run a one-off task         |
| `zode auth`           | Manage authentication      |
| `zode models`         | List available models      |
| `zode mcp`            | Manage MCP servers         |
| `zode session list`   | List sessions              |
| `zode session delete` | Delete a session           |
| `zode export`         | Export session transcripts |

Run `zode --help` for the full list.

## Alternative Installation

### Homebrew (macOS/Linux)

```bash
brew install Zode-Org/tap/zode
```

### GitHub Releases

Download pre-built binaries from the [Releases page](https://github.com/Zode-Org/zodecode/releases).

## Documentation

- [Docs](https://kilo.ai/docs)
- [Getting Started](https://kilo.ai/docs/getting-started)

## Links

- [GitHub](https://github.com/Zode-Org/zodecode)
- [Discord](https://kilo.ai/discord)
- [VS Code Extension](https://kilo.ai/vscode-marketplace)
- [Website](https://kilo.ai)

## License

MIT
