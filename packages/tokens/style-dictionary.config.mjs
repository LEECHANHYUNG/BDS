export default {
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
          format: "javascript/es6",
          options: {
            outputReferences: true,
          },
        },
        {
          destination: "index.d.ts",
          format: "typescript/es6-declarations",
        },
      ],
    },
  },
};
