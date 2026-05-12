import { expect } from "chai";
import path from "path";

import { ESLint } from "eslint";

/**
 * Anti-regression guard for RGAA criterion 8.3 (page language declared).
 *
 * Verifies, via the project's flat ESLint config, that the two files
 * containing top-level <html> tags emit zero `jsx-a11y/html-has-lang`
 * warnings.
 *
 * If a future change removes the `lang` attribute (or the eslint-disable
 * comment that documents the DSFR spread case in layout.tsx), this test
 * fails immediately.
 */
describe("a11y — jsx-a11y/html-has-lang", () => {
  const repoRoot = path.resolve(__dirname, "..");
  const targets = [
    path.join(repoRoot, "src", "app", "global-error.tsx"),
    path.join(repoRoot, "src", "app", "layout.tsx"),
  ];

  it("emits 0 html-has-lang warnings on top-level <html> files", async () => {
    const eslint = new ESLint({ cwd: repoRoot });
    const results = await eslint.lintFiles(targets);

    const offending = results.flatMap((r) =>
      r.messages
        .filter((m) => m.ruleId === "jsx-a11y/html-has-lang")
        .map(
          (m) =>
            `${path.relative(repoRoot, r.filePath)}:${m.line} ${m.message}`,
        ),
    );

    expect(offending, offending.join("\n")).to.have.lengthOf(0);
  }).timeout(30000);
});
