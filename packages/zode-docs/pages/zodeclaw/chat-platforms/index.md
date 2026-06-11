---
title: "Chat Platforms"
description: "Use Zode Chat or connect your ZodeClaw agent to Telegram, Discord, and Slack"
---

# Chat Platforms

ZodeClaw includes Zode Chat as its first-party channel and also supports connecting your AI agent to messaging platforms so it can receive instructions and send responses directly in your chat apps. You can configure third-party channels from the **Settings** tab on your [ZodeClaw dashboard](/docs/zodeclaw/dashboard#channels), or from the OpenClaw Control UI after accessing your instance.

## Zode Chat

Zode Chat is the zero-setup, first-party channel for ZodeClaw. It is enabled by default, does not require a per-sandbox channel token, and is available from the Zode web and mobile apps as well as supported Zode Code editor and TUI surfaces.

Use Zode Chat when you want to talk to your Claw without configuring a separate bot or app in another messaging platform. For external team chat tools, use one of the third-party channels below.

## Third-Party Platforms

The general steps to connect a third-party chat platform are:

1. Configure the channel token in Settings
2. Redeploy the ZodeClaw instance
3. Initiate the pairing in the chat app
4. Accept the pairing request in the [ZodeClaw UI](https://app.__PRESERVE_ZODE_AI__/claw)

## Supported Platforms

- [**Zode Chat**](https://app.__PRESERVE_ZODE_AI__) — Use the built-in first-party channel with no token setup.
- [**Telegram**](/docs/zodeclaw/chat-platforms/telegram) — Connect via a BotFather bot token.
- [**Discord**](/docs/zodeclaw/chat-platforms/discord) — Connect via a Discord Developer Portal bot token.
- [**Slack**](/docs/zodeclaw/chat-platforms/slack) — Connect via a Slack app manifest with app-level and bot tokens.
