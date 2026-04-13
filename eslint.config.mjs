import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "prefer-const": "error",
      "no-restricted-imports": [
        "error",
        {
          "patterns": [
            {
              "group": ["../../features/*"],
              "message": "Use feature public API (@features/[feature]/index) instead of direct imports"
            },
            {
              "group": ["../../lib/*"],
              "message": "Migrated to src/features or src/shared. Update import path"
            },
            {
              "group": ["../../hooks/*"],
              "message": "Migrated to src/shared/hooks"
            },
            {
              "group": ["../../agents/*"],
              "message": "Migrated to src/features/ai"
            }
          ]
        }
      ]
    },
  },
]);

export default eslintConfig;
