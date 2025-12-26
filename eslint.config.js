import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import {
  flatPlugin as reactComponentName,
  configs as reactComponentNameConfigs,
} from "eslint-plugin-react-component-name"
import tseslint from "typescript-eslint"
import {defineConfig, globalIgnores} from "eslint/config"

export default defineConfig([
  globalIgnores(["dist"]),
  {
    plugins: {
      reactComponentName,
    },
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      reactComponentNameConfigs.flat.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
