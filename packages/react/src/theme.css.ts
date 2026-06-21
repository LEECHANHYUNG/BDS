import { createGlobalThemeContract } from "@vanilla-extract/css";

export const vars = createGlobalThemeContract(
  {
    color: {
      danger: {
        background: null,
        backgroundHover: null,
        foreground: null,
      },
      focus: {
        ring: null,
      },
      neutral: {
        background: null,
        backgroundHover: null,
        foreground: null,
      },
      primary: {
        background: null,
        backgroundHover: null,
        foreground: null,
      },
    },
    spacing: {
      control: {
        x: null,
        y: null,
      },
    },
    radius: {
      control: null,
    },
    borderWidth: {
      control: null,
    },
    focusRing: {
      offset: null,
      width: null,
    },
  },
  (_value, path) =>
    `bds-${path.map((key) => key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)).join("-")}`,
);
