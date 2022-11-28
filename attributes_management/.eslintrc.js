module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
  },
  overrides: [
    {
      files: ["./src/**/*.ts", "wait-until-migrated.ts"],
      parserOptions: {
        project: "tsconfig.json",
        tsconfigRootDir: __dirname,
        sourceType: "module",
      },
    },
    {
      files: ["./tests/**/*.ts", "./__mocks__/**/*.ts"],
      parserOptions: {
        project: "./tsconfig.test.json",
        tsconfigRootDir: __dirname,
        sourceType: "module",
      },
    },
  ],
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "require-await": "off",
    "@typescript-eslint/require-await": "error",
    "arrow-body-style": ["error", "as-needed"],
  },
  env: {
    node: true,
  },
  ignorePatterns: ["dist/*", ".eslintrc.js"],
}
