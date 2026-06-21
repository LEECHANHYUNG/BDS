const publicSourceSegments = ["/semantic/", "/domain/"];

const toKebab = (value) => value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);

const isPublicToken = (token) =>
  publicSourceSegments.some((segment) => token.filePath.includes(segment));

const cssVarName = (token) => `--bds-${token.path.map(toKebab).join("-")}`;

const publicTokens = (dictionary) => dictionary.allTokens.filter(isPublicToken);

export default {
  hooks: {
    formats: {
      "bds/javascript": ({ dictionary }) =>
        `${publicTokens(dictionary)
          .map(
            (token) =>
              `export const ${token.name} = ${JSON.stringify(`var(${cssVarName(token)})`)};`,
          )
          .join("\n")}\n`,
      "bds/typescript-declarations": ({ dictionary }) =>
        `${publicTokens(dictionary)
          .map((token) => `export const ${token.name}: string;`)
          .join("\n")}\n`,
    },
  },
  source: ["src/**/*.json"],
  platforms: {
    css: {
      prefix: "bds",
      transforms: ["attribute/cti", "name/kebab", "size/rem", "color/oklch"],
      buildPath: "dist/",
      files: [
        {
          destination: "bds-tokens.css",
          format: "css/variables",
          options: {
            outputReferences: true,
            selector: ":root",
          },
        },
      ],
    },
    js: {
      transforms: ["attribute/cti", "name/camel", "size/rem", "color/oklch"],
      buildPath: "dist/",
      files: [
        {
          destination: "index.js",
          format: "bds/javascript",
        },
        {
          destination: "index.d.ts",
          format: "bds/typescript-declarations",
        },
      ],
    },
  },
};
