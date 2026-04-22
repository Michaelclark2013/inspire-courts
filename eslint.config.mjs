import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Remotion side-project has its own tooling — skip it.
    "remotion-promo/**",
  ]),
  // React 19's newly-strict render-safety rules flag a handful of
  // legitimate patterns we use across the app:
  //   - set-state-in-effect: used for prop→state sync, PWA install
  //     detection, subscription state, and conditional
  //     initialization. Every call site has been reviewed; the
  //     conditional guards already prevent the cascading-renders
  //     failure mode the rule is designed to catch. Keeping as a
  //     warning so new genuine regressions still surface without
  //     breaking the build.
  //   - impure-function: Date.now() inside interval callbacks (not
  //     during render) is legitimate. Render-phase Date.now() calls
  //     have been migrated to the useState + setNow-on-tick pattern
  //     (see UpcomingGames.tsx, my-schedule page, StalenessIndicator).
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
