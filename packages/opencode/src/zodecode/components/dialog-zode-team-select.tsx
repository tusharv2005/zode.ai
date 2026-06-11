/**
 * Zode Gateway Team Selection Dialog
 *
 * Allows switching between organizations and personal account.
 * Marks the current team with "→ (current)" indicator.
 */

import { DialogSelect } from "@tui/ui/dialog-select"
import type { Organization } from "@zodecode/zode-gateway"
import { getOrganizationOptions } from "@zodecode/zode-gateway/tui"

interface DialogZodeTeamSelectProps {
  organizations: Organization[]
  currentOrgId?: string | null
  onSelect: (orgId: string | null) => Promise<void>
}

export function DialogZodeTeamSelect(props: DialogZodeTeamSelectProps) {
  // Get formatted options with current markers
  const options = getOrganizationOptions(props.organizations, props.currentOrgId || undefined)

  return (
    <DialogSelect
      title="Select Team"
      options={options}
      current={props.currentOrgId || null}
      onSelect={async (option: any) => {
        await props.onSelect(option.value)
      }}
    />
  )
}
