// ZodeClaw setup view — shown when no instance is provisioned

import { Button } from "@zodecode/zode-ui/button"
import { Card, CardTitle, CardDescription, CardActions } from "@zodecode/zode-ui/card"
import { useClaw } from "../context/claw"
import { useZodeClawLanguage } from "../context/language"

export function SetupView() {
  const claw = useClaw()
  const { t } = useZodeClawLanguage()

  return (
    <div class="zodeclaw-center">
      <Card class="zodeclaw-card">
        <CardTitle icon={false}>{t("zodeClaw.setup.title")}</CardTitle>
        <CardDescription>
          <h3 class="zodeclaw-card-subtitle">{t("zodeClaw.setup.subtitle")}</h3>
          <p class="zodeclaw-card-text">{t("zodeClaw.setup.description1")}</p>
          <p class="zodeclaw-card-text">{t("zodeClaw.setup.description2")}</p>
        </CardDescription>
        <CardActions>
          <Button variant="ghost" onClick={() => claw.openExternal("https://kilo.ai/zodeclaw")}>
            {t("zodeClaw.setup.learnMore")}
          </Button>
          <Button variant="primary" onClick={() => claw.openExternal("https://app.kilo.ai/claw")}>
            {t("zodeClaw.setup.tryZodeClaw")}
          </Button>
        </CardActions>
      </Card>
    </div>
  )
}
