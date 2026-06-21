import { createGlobalThemeContract } from "@vanilla-extract/css";

export const vars = createGlobalThemeContract(
  {
    color: {
      primary: null,
    },
    spacing: {
      button: {
        x: null,
      },
    },
    borderWidth: {
      button: null,
    },
  },
  (_value, path) =>
    `bds-${path.map((key) => key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)).join("-")}`,
);
