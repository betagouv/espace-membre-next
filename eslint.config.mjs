import nextConfig from "eslint-config-next/core-web-vitals";
import { globalIgnores } from "eslint/config";

import prettierRecommended from "eslint-plugin-prettier/recommended";

export default [
  ...nextConfig,
  prettierRecommended,
  globalIgnores(["**/*.spec.ts"]),
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "react/no-children-prop": "warn",
      "import/no-named-as-default": "warn",
      "import/no-named-as-default-member": "warn",
      "import/named": "warn",
    },
  },
];
