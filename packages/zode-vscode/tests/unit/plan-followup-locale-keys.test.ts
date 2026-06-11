import { describe, expect, test } from "bun:test"
import { dict as ar } from "@zodecode/zode-i18n/ar"
import { dict as br } from "@zodecode/zode-i18n/br"
import { dict as bs } from "@zodecode/zode-i18n/bs"
import { dict as da } from "@zodecode/zode-i18n/da"
import { dict as de } from "@zodecode/zode-i18n/de"
import { dict as en } from "@zodecode/zode-i18n/en"
import { dict as es } from "@zodecode/zode-i18n/es"
import { dict as fr } from "@zodecode/zode-i18n/fr"
import { dict as it } from "@zodecode/zode-i18n/it"
import { dict as ja } from "@zodecode/zode-i18n/ja"
import { dict as ko } from "@zodecode/zode-i18n/ko"
import { dict as nl } from "@zodecode/zode-i18n/nl"
import { dict as no } from "@zodecode/zode-i18n/no"
import { dict as pl } from "@zodecode/zode-i18n/pl"
import { dict as ru } from "@zodecode/zode-i18n/ru"
import { dict as th } from "@zodecode/zode-i18n/th"
import { dict as tr } from "@zodecode/zode-i18n/tr"
import { dict as uk } from "@zodecode/zode-i18n/uk"
import { dict as zh } from "@zodecode/zode-i18n/zh"
import { dict as zht } from "@zodecode/zode-i18n/zht"

const dicts: Record<string, Record<string, string>> = {
  ar,
  br,
  bs,
  da,
  de,
  en,
  es,
  fr,
  it,
  ja,
  ko,
  nl,
  no,
  pl,
  ru,
  th,
  tr,
  uk,
  zh,
  zht,
}

const keys = [
  "plan.followup.header",
  "plan.followup.question",
  "plan.followup.answer.newSession",
  "plan.followup.answer.newSession.description",
  "plan.followup.answer.continue",
  "plan.followup.answer.continue.description",
]

describe("plan follow-up i18n keys", () => {
  for (const locale of Object.keys(dicts)) {
    test(`${locale} defines every plan.followup.* key`, () => {
      const d = dicts[locale]!
      for (const key of keys) {
        const value = d[key]
        expect(value, `${locale} is missing ${key}`).toBeDefined()
        expect(value, `${locale} has empty value for ${key}`).toBeTruthy()
      }
    })
  }
})
