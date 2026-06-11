import { NavSection } from "../types"

export const ZodeClawNav: NavSection[] = [
  {
    title: "ZodeClaw",
    links: [
      { href: "/zodeclaw/overview", children: "Overview" },
      { href: "/zodeclaw/dashboard", children: "Dashboard" },
      { href: "/zodeclaw/pre-installed-software", children: "Pre-installed Software" },
      { href: "/zodeclaw/end-to-end", children: "End to End Config" },
      {
        href: "/zodeclaw/control-ui/overview",
        children: "Control UI",
        subLinks: [
          { href: "/zodeclaw/control-ui/overview", children: "Overview" },
          { href: "/zodeclaw/control-ui/changing-models", children: "Changing Models" },
          { href: "/zodeclaw/control-ui/exec-approvals", children: "Exec Approvals" },
          { href: "/zodeclaw/control-ui/version-pinning", children: "Version Pinning" },
        ],
      },
      {
        href: "/zodeclaw/chat-platforms",
        children: "Chat Platforms",
        subLinks: [
          { href: "/zodeclaw/chat-platforms", children: "Overview" },
          { href: "/zodeclaw/chat-platforms/telegram", children: "Telegram" },
          { href: "/zodeclaw/chat-platforms/discord", children: "Discord" },
          { href: "/zodeclaw/chat-platforms/slack", children: "Slack" },
        ],
      },
      {
        href: "/zodeclaw/development-tools",
        children: "Development Tools",
        subLinks: [
          { href: "/zodeclaw/development-tools", children: "Overview" },
          { href: "/zodeclaw/development-tools/github", children: "GitHub" },
          { href: "/zodeclaw/development-tools/google", children: "Google Workspace" },
        ],
      },
      {
        href: "/zodeclaw/triggers",
        children: "Triggers",
        subLinks: [
          { href: "/zodeclaw/triggers", children: "Overview" },
          { href: "/zodeclaw/triggers/webhooks", children: "Webhooks" },
          { href: "/zodeclaw/triggers/scheduled", children: "Scheduled" },
        ],
      },
      {
        href: "/zodeclaw/tools",
        children: "Tools",
        subLinks: [
          { href: "/zodeclaw/tools", children: "Overview" },
          { href: "/zodeclaw/tools/1password", children: "1Password" },
          { href: "/zodeclaw/tools/brave-search", children: "Brave Search" },
          { href: "/zodeclaw/tools/agentcard", children: "AgentCard" },
          { href: "/zodeclaw/tools/other-tools", children: "Other Tools" },
        ],
      },
      {
        href: "/zodeclaw/troubleshooting/common-questions",
        children: "Troubleshooting",
        subLinks: [
          { href: "/zodeclaw/troubleshooting/common-questions", children: "Common Questions" },
          { href: "/zodeclaw/troubleshooting/gateway-process", children: "Gateway Process States" },
          { href: "/zodeclaw/troubleshooting/architecture", children: "Architecture Notes" },
        ],
      },
      {
        href: "/zodeclaw/faq/general",
        children: "FAQ",
        subLinks: [
          { href: "/zodeclaw/faq/general", children: "General" },
          { href: "/zodeclaw/faq/pricing", children: "Pricing" },
        ],
      },
    ],
  },
]
