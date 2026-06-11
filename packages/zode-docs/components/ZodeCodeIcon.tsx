import React from "react"
import { Icon } from "./Icon"

interface ZodeCodeIconProps {
  size?: string
}

export function ZodeCodeIcon({ size = "1.2em" }: ZodeCodeIconProps) {
  return <Icon src="/docs/img/zode-v1.svg" srcDark="/docs/img/zode-v1-white.svg" alt="Zode Code Icon" size={size} />
}
