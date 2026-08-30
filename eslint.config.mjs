import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["**/dist/**", "**/.next/**", "**/node_modules/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        Buffer: "readonly",
        Headers: "readonly",
        Request: "readonly",
        Response: "readonly",
        URL: "readonly",
        clearTimeout: "readonly",
        console: "readonly",
        crypto: "readonly",
        fetch: "readonly",
        process: "readonly",
        setTimeout: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-useless-catch": "off",
    },
  },
];
