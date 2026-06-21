import { recipe } from "@vanilla-extract/recipes";
import { vars } from "../theme.css";

export const button = recipe({
  base: {
    alignItems: "center",
    appearance: "none",
    borderRadius: vars.radius.control,
    borderStyle: "solid",
    borderWidth: vars.borderWidth.control,
    cursor: "pointer",
    display: "inline-flex",
    font: "inherit",
    fontWeight: 600,
    justifyContent: "center",
    lineHeight: "inherit",
    paddingBlock: vars.spacing.control.y,
    paddingInline: vars.spacing.control.x,
    selectors: {
      "&:disabled": {
        cursor: "not-allowed",
        opacity: 0.55,
      },
      "&:focus": {
        outline: "none",
      },
      "&:focus-visible": {
        outlineColor: vars.color.focus.ring,
        outlineOffset: vars.focusRing.offset,
        outlineStyle: "solid",
        outlineWidth: vars.focusRing.width,
      },
    },
  },
  defaultVariants: {
    intent: "primary",
  },
  variants: {
    intent: {
      danger: {
        backgroundColor: vars.color.danger.background,
        borderColor: vars.color.danger.background,
        color: vars.color.danger.foreground,
        selectors: {
          "&:not(:disabled):hover": {
            backgroundColor: vars.color.danger.backgroundHover,
            borderColor: vars.color.danger.backgroundHover,
          },
        },
      },
      neutral: {
        backgroundColor: vars.color.neutral.background,
        borderColor: vars.color.neutral.background,
        color: vars.color.neutral.foreground,
        selectors: {
          "&:not(:disabled):hover": {
            backgroundColor: vars.color.neutral.backgroundHover,
            borderColor: vars.color.neutral.backgroundHover,
          },
        },
      },
      primary: {
        backgroundColor: vars.color.primary.background,
        borderColor: vars.color.primary.background,
        color: vars.color.primary.foreground,
        selectors: {
          "&:not(:disabled):hover": {
            backgroundColor: vars.color.primary.backgroundHover,
            borderColor: vars.color.primary.backgroundHover,
          },
        },
      },
    },
  },
});
