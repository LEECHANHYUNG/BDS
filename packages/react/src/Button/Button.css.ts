import { style } from "@vanilla-extract/css";
import { vars } from "../theme.css";

export const button = style({
  backgroundColor: vars.color.primary,
  border: `${vars.borderWidth.button} solid ${vars.color.primary}`,
  paddingInline: vars.spacing.button.x,
});
