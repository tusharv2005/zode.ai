// ZodeClaw upgrade view — shown when instance needs upgrade for chat

import { Button } from "@zodecode/zode-ui/button"
import { Card, CardTitle, CardDescription, CardActions } from "@zodecode/zode-ui/card"
import { useClaw } from "../context/claw"
import { useZodeClawLanguage } from "../context/language"

export function UpgradeView() {
  const claw = useClaw()
  const { t } = useZodeClawLanguage()

  return (
    <div class="zodeclaw-center">
      <Card class="zodeclaw-card">
        <CardTitle icon={false}>{t("zodeClaw.upgrade.title")}</CardTitle>
        <CardDescription>
          <p class="zodeclaw-card-text">{t("zodeClaw.upgrade.description1")}</p>
          <p class="zodeclaw-card-text">
            {t("zodeClaw.upgrade.description2.before")}
            <strong>{t("zodeClaw.upgrade.description2.bold")}</strong>
            {t("zodeClaw.upgrade.description2.after")}
          </p>
        </CardDescription>
        <CardActions>
          <div />
          <Button variant="primary" onClick={() => claw.openExternal("https://app.__PRESERVE_ZODE_AI__/claw")}>
            {t("zodeClaw.upgrade.openDashboard")}
          </Button>
        </CardActions>
      </Card>
    </div>
  )
}
