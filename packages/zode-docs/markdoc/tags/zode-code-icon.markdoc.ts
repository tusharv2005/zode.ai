import { ZodeCodeIcon } from "../../components"

export const zodeCodeIcon = {
  render: ZodeCodeIcon,
  selfClosing: true,
  attributes: {
    size: {
      type: String,
      default: "1.2em",
      description: "Size of the icon (CSS height value)",
    },
  },
}
