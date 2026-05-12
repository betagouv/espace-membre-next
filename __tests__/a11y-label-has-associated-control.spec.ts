import { expect } from "chai";
import path from "path";

import { ESLint } from "eslint";

/**
 * Anti-regression guard for RGAA criterion 11.1 (form label associated with
 * its control).
 *
 * Five `<label className="fr-label">` tags previously wrapped custom editors
 * (MdEditor, PhasesEditor, EventsEditor) that do not expose a controllable
 * <input>/id, so the label could not be programmatically associated. They
 * have been converted to `<p className="fr-label">` (visual styling kept via
 * DSFR; margin neutralized inline).
 *
 * If any future change reintroduces a `<label>` without `htmlFor` (or without
 * a nested control) on these forms, this test fails immediately.
 */
describe("a11y — jsx-a11y/label-has-associated-control", () => {
  const repoRoot = path.resolve(__dirname, "..");
  const targets = [
    path.join(repoRoot, "src", "components", "IncubatorForm", "IncubatorForm.tsx"),
    path.join(repoRoot, "src", "components", "StartupForm", "StartupForm.tsx"),
    path.join(repoRoot, "src", "components", "team", "TeamForm", "TeamForm.tsx"),
  ];

  it("emits 0 label-has-associated-control warnings on patched form files", async () => {
    const eslint = new ESLint({ cwd: repoRoot });
    const results = await eslint.lintFiles(targets);

    const offending = results.flatMap((r) =>
      r.messages
        .filter((m) => m.ruleId === "jsx-a11y/label-has-associated-control")
        .map(
          (m) =>
            `${path.relative(repoRoot, r.filePath)}:${m.line} ${m.message}`,
        ),
    );

    expect(offending, offending.join("\n")).to.have.lengthOf(0);
  }).timeout(30000);
});
