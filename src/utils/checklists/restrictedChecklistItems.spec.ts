import { expect } from "chai";

import { getChecklistObject } from "./getChecklistObject";
import { RESTRICTED_CHECKLIST_ITEM_IDS } from "./restrictedChecklistItems";

describe("restrictedChecklistItems", () => {
  // Garde-fou : renommer un id dans onboarding.yml sans toucher à la constante
  // désactiverait la protection en silence.
  it("should only reference ids that exist in the checklists", async () => {
    const checklists = await Promise.all([
      getChecklistObject("onboarding"),
      getChecklistObject("offboarding"),
    ]);
    const existingIds = checklists.flatMap((checklist) =>
      (checklist ?? []).flatMap((section) => section.items.map((i) => i.id)),
    );
    for (const id of RESTRICTED_CHECKLIST_ITEM_IDS) {
      expect(existingIds).to.include(id);
    }
  });

  it("should not reference items disabled in the yml, which are never writable", async () => {
    const checklist = (await getChecklistObject("onboarding")) ?? [];
    const disabledIds = checklist.flatMap((section) =>
      section.items.filter((i) => i.disabled).map((i) => i.id),
    );
    for (const id of RESTRICTED_CHECKLIST_ITEM_IDS) {
      expect(disabledIds).to.not.include(id);
    }
  });
});
