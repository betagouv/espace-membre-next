import { expect } from "chai";
import path from "path";

import { ESLint } from "eslint";

/**
 * Anti-regression guard for RGAA criteria 7.1 / 7.3 (interactive elements
 * accessible via keyboard).
 *
 * Sixteen warnings (10x click-events-have-key-events + 6x
 * no-static-element-interactions) lived on:
 *   - <span onClick> used as action triggers (Community / StartupList)
 *   - <i onClick> used as a delete button (StartupMembers)
 *   - third-party MdEditor header plugin (<span> hover menu + <hN onClick>)
 *
 * Fixes:
 *   - <span>/<i> action triggers converted to <button type="button"> with a
 *     minimal CSS reset to preserve the DSFR fr-link visual.
 *   - MdEditor plugin: role="button" + tabIndex={0} + onKeyDown/onFocus/
 *     onBlur added to the existing static elements.
 *
 * If any future change reintroduces a static element with onClick but no
 * keyboard equivalent on these files, this test fails immediately.
 */
describe("a11y — keyboard interactions on static elements", () => {
  const repoRoot = path.resolve(__dirname, "..");
  const targets = [
    path.join(repoRoot, "src", "components", "CommunityPage", "Community.tsx"),
    path.join(
      repoRoot,
      "src",
      "components",
      "StartupForm",
      "MdEditorCustomHeaderPlugin.tsx",
    ),
    path.join(
      repoRoot,
      "src",
      "components",
      "StartupListPage",
      "StartupList.tsx",
    ),
    path.join(
      repoRoot,
      "src",
      "components",
      "StartupPage",
      "StartupMembers.tsx",
    ),
  ];

  it("emits 0 click-events-have-key-events / no-static-element-interactions warnings", async () => {
    const eslint = new ESLint({ cwd: repoRoot });
    const results = await eslint.lintFiles(targets);
    const watched = new Set([
      "jsx-a11y/click-events-have-key-events",
      "jsx-a11y/no-static-element-interactions",
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
