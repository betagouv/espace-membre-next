import { expect } from "chai";

import { getChecklistObject } from "./getChecklistObject";

const RESTRICTED_ITEM_ID = "onboarding-atelier-onboarding";

describe("restricted checklist items", () => {
  // Garde-fou : retirer `restricted: true` du yml rouvrirait la case à
  // l'auto-déclaration sans que rien ne le signale.
  it("should keep the embarquement workshop item restricted", async () => {
    const checklist = (await getChecklistObject("onboarding")) ?? [];
    const item = checklist
      .flatMap((section) => section.items)
      .find((i) => i.id === RESTRICTED_ITEM_ID);

    expect(item, `${RESTRICTED_ITEM_ID} introuvable dans onboarding.yml`).to.not
      .be.undefined;
    expect(item?.restricted).to.be.true;
  });

  it("should never mark an item both restricted and disabled", async () => {
    // Un item `disabled` n'est jamais inscriptible en base : le marquer
    // `restricted` donnerait un droit que personne ne peut exercer.
    const checklists = await Promise.all([
      getChecklistObject("onboarding"),
      getChecklistObject("offboarding"),
    ]);
    const items = checklists.flatMap((checklist) =>
      (checklist ?? []).flatMap((section) => section.items),
    );
    const both = items
      .filter((i) => i.restricted && i.disabled)
      .map((i) => i.id);
    expect(both).to.deep.equal([]);
  });
});
