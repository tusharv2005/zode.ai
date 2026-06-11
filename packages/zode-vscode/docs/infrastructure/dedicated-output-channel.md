# Dedicated Output Channel

**Priority:** P2

Agent Manager has its own output channel. No general "Zode Code" output channel exists.

## Remaining Work

- Create `vscode.window.createOutputChannel("Zode Code")` during activation
- Centralized logging utility with log levels (debug, info, warn, error)
- Route all `[Zode New]` log messages to this channel
- Dispose on deactivation
- Migrate existing `console.log("[Zode New] ...")` calls to the logger
