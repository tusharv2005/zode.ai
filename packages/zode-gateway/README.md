# @zodecode/zode-gateway

Unified Zode Gateway package for OpenCode providing authentication, AI provider integration, and API access.

## Features

- **Authentication**: Device authorization flow for Zode Gateway
- **AI Provider**: OpenRouter-based provider with Zode Gateway integration
- **API Integration**: Profile, balance, and model management
- **TUI Helpers**: Utilities for terminal UI components

## Installation

```bash
bun add @zodecode/zode-gateway
```

## Usage

### Plugin Registration

```typescript
import { ZodeAuthPlugin } from "@zodecode/zode-gateway"

// Register with OpenCode
const plugins = [ZodeAuthPlugin]
```

### Provider Usage

```typescript
import { createZode } from "@zodecode/zode-gateway"

const provider = createZode({
  zodecodeToken: process.env.ZODECODE_API_KEY,
  zodecodeOrganizationId: "org-123",
})

const model = provider.languageModel("anthropic/claude-sonnet-4")
```

### API Access

```typescript
import { fetchProfile, fetchBalance } from "@zodecode/zode-gateway"

const profile = await fetchProfile(token)
const balance = await fetchBalance(token)
```

## License

MIT
