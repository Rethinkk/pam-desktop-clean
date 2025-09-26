cat > eslint.config.mjs <<'EOF'
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".vite/**",
      "public/**",
      "js/**"              // <-- legacy JS uitsluiten
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node }
    }
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      "react/prop-types": "off",
      "react/jsx-no-target-blank": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }]
    },
    settings: { react: { version: "detect" } }
  }
);
EOF
