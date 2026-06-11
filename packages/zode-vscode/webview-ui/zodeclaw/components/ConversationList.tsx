// ZodeClaw conversation sidebar — mirrors the web UI in
// cloud/apps/web/src/app/(app)/claw/zode-chat/components/ConversationList.tsx

import { For, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js"
import { useClaw } from "../context/claw"
import { useZodeClawLanguage } from "../context/language"
import type { ConversationListItem } from "../lib/types"

type Group = { label: string; items: ConversationListItem[] }

function groupConversations(convs: ConversationListItem[], labels: Record<string, string>): Group[] {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterdayStart = todayStart - 86_400_000
  const weekStart = todayStart - 6 * 86_400_000

  const buckets: Record<string, ConversationListItem[]> = {
    today: [],
    yesterday: [],
    week: [],
    older: [],
  }

  for (const c of convs) {
    const ts = c.lastActivityAt ?? c.joinedAt
    if (ts >= todayStart) buckets.today.push(c)
    else if (ts >= yesterdayStart) buckets.yesterday.push(c)
    else if (ts >= weekStart) buckets.week.push(c)
    else buckets.older.push(c)
  }

  const order: Array<[keyof typeof buckets, string]> = [
    ["today", labels.today],
    ["yesterday", labels.yesterday],
    ["week", labels.week],
    ["older", labels.older],
  ]
  return order.filter(([key]) => buckets[key].length > 0).map(([key, label]) => ({ label, items: buckets[key] }))
}

export function ConversationList() {
  const claw = useClaw()
  const { t } = useZodeClawLanguage()

  const groups = createMemo(() =>
    groupConversations(claw.conversations(), {
      today: t("zodeClaw.conversations.groupToday"),
      yesterday: t("zodeClaw.conversations.groupYesterday"),
      week: t("zodeClaw.conversations.groupThisWeek"),
      older: t("zodeClaw.conversations.groupOlder"),
    }),
  )

  let scrollEl!: HTMLDivElement

  const onScroll = () => {
    if (!scrollEl) return
    if (!claw.hasMoreConversations()) return
    if (scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 80) {
      claw.loadMoreConversations()
    }
  }

  onMount(() => scrollEl?.addEventListener("scroll", onScroll))
  onCleanup(() => scrollEl?.removeEventListener("scroll", onScroll))

  return (
    <div class="zodeclaw-convlist">
      <div class="zodeclaw-convlist-header">
        <span class="zodeclaw-convlist-title">{t("zodeClaw.conversations.title")}</span>
        <button
          type="button"
          class="zodeclaw-iconbtn"
          onClick={() => claw.createConversation()}
          aria-label={t("zodeClaw.conversations.new")}
          title={t("zodeClaw.conversations.new")}
        >
          +
        </button>
      </div>
      <div class="zodeclaw-convlist-scroll" ref={scrollEl}>
        <Show
          when={claw.conversations().length > 0}
          fallback={<div class="zodeclaw-convlist-empty">{t("zodeClaw.conversations.empty")}</div>}
        >
          <For each={groups()}>
            {(group) => (
              <div class="zodeclaw-convlist-group">
                <div class="zodeclaw-convlist-grouplabel">{group.label}</div>
                <For each={group.items}>{(conv) => <ConversationItem conversation={conv} />}</For>
              </div>
            )}
          </For>
        </Show>
      </div>
    </div>
  )
}

function ConversationItem(props: { conversation: ConversationListItem }) {
  const claw = useClaw()
  const { t } = useZodeClawLanguage()
  const [isRenaming, setIsRenaming] = createSignal(false)
  const [renameText, setRenameText] = createSignal("")
  let inputEl: HTMLInputElement | undefined

  const isActive = createMemo(() => claw.activeConversationId() === props.conversation.conversationId)
  const isUnread = createMemo(() => {
    const { lastActivityAt, lastReadAt } = props.conversation
    if (!lastActivityAt) return false
    return lastReadAt === null || lastReadAt < lastActivityAt
  })

  const startRename = (e: MouseEvent) => {
    e.stopPropagation()
    setRenameText(props.conversation.title ?? "")
    setIsRenaming(true)
    queueMicrotask(() => inputEl?.focus())
  }

  const commitRename = () => {
    const title = renameText().trim()
    if (title && title !== (props.conversation.title ?? "")) {
      claw.renameConversation(props.conversation.conversationId, title)
    }
    setIsRenaming(false)
  }

  const cancelRename = () => {
    setRenameText("")
    setIsRenaming(false)
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      commitRename()
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelRename()
    }
  }

  return (
    <div
      class={`zodeclaw-convitem ${isActive() ? "zodeclaw-convitem-active" : ""}`}
      onClick={() => {
        if (isRenaming()) return
        claw.selectConversation(props.conversation.conversationId)
      }}
      role="button"
      tabindex={0}
    >
      <Show
        when={!isRenaming()}
        fallback={
          <input
            ref={inputEl}
            class="zodeclaw-convitem-renameinput"
            value={renameText()}
            onInput={(e) => setRenameText(e.currentTarget.value)}
            onKeyDown={onKey}
            onBlur={commitRename}
            onClick={(e) => e.stopPropagation()}
            maxLength={200}
          />
        }
      >
        <span class="zodeclaw-convitem-title">
          <Show when={isUnread()}>
            <span class="zodeclaw-convitem-unread" aria-hidden="true" />
          </Show>
          {props.conversation.title ?? t("zodeClaw.conversations.untitled")}
        </span>
      </Show>
      <div class="zodeclaw-convitem-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          class="zodeclaw-iconbtn-sm"
          onClick={startRename}
          title={t("zodeClaw.conversations.rename")}
          aria-label={t("zodeClaw.conversations.rename")}
        >
          ✎
        </button>
        <button
          type="button"
          class="zodeclaw-iconbtn-sm zodeclaw-iconbtn-danger"
          onClick={() => claw.leaveConversation(props.conversation.conversationId)}
          title={t("zodeClaw.conversations.leave")}
          aria-label={t("zodeClaw.conversations.leave")}
        >
          ×
        </button>
      </div>
    </div>
  )
}
