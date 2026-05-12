import { expect } from "chai";
import path from "path";

import { ESLint } from "eslint";

/**
 * Anti-regression guard for the residual jsx-a11y warnings that remained
 * after PRs #1361 / #1363 / #1364:
 *
 *   - 5x jsx-a11y/no-noninteractive-element-interactions on
 *     MdEditorCustomHeaderPlugin.tsx (the <hN onClick> menu items, even
 *     after role+tabIndex+onKeyDown were added in #1364).
 *   - 1x jsx-a11y/no-redundant-roles on MissionsEditor.tsx (an explicit
 *     role="button" on a native <button>).
 *
 * Fixes:
 *   - MdEditorCustomHeaderPlugin: each <hN onClick role onKeyDown> is now
 *     a <button type="button"> wrapping the <hN> for visual hierarchy.
 *     The button is interactive natively → no role/tabIndex gymnastics
 *     and no rule violation.
 *   - MissionsEditor: removed the redundant role="button" on a <button>.
 *
 * Together with #1361 / #1363 / #1364, this brings the project to ZERO
 * jsx-a11y warnings against the recommended preset (RGAA baseline #1355).
 */
describe("a11y — baseline residuals", () => {
  const repoRoot = path.resolve(__dirname, "..");
  const targets = [
    path.join(
      repoRoot,
      "src",
      "components",
      "BaseInfoUpdatePage",
      "MissionsEditor.tsx",
    ),
    path.join(
      repoRoot,
      "src",
      "components",
      "StartupForm",
      "MdEditorCustomHeaderPlugin.tsx",
    ),
  ];

  it("emits 0 no-noninteractive-element-interactions / no-redundant-roles warnings", async () => {
    const eslint = new ESLint({ cwd: repoRoot });
    const results = await eslint.lintFiles(targets);
    const watched = new Set([
      "jsx-a11y/no-noninteractive-element-interactions",
      "jsx-a11y/no-redundant-roles",
    ]);

    const offending = results.flatMap((r) =>
      r.messages
        .filter((m) => m.ruleId !== null && watched.has(m.ruleId))
        .map(
          (m) =>
            `${path.relative(repoRoot, r.filePath)}:${m.line} ${m.ruleId} — ${m.message}`,
        ),
    );

    expect(offending, offending.join("\n")).to.have.lengthOf(0);
  }).timeout(30000);
});
