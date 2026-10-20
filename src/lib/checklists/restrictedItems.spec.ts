import { expect } from "chai";

import { allowedChecklists, getChecklistObject } from "./getChecklistObject";

const RESTRICTED_ITEM_ID = "onboarding-atelier-onboarding";

describe("restricted checklist items", () => {
  // Garde-fou : retirer `restricted: true` du yml rouvrirait la case à
  // l'auto-déclaration sans que rien ne le signale. Vérifié dans chaque
  // checklist d'embarquement : n8n arrête ses relances sur cet id, quel que
  // soit le domaine du membre.
  for (const type of ["onboarding", "onboarding-intrapreneur"] as const) {
    it(`should keep the embarquement workshop item restricted in ${type}`, async () => {
      const checklist = (await getChecklistObject(type)) ?? [];
      const item = checklist
        .flatMap((section) => section.items)
        .find((i) => i.id === RESTRICTED_ITEM_ID);

      expect(item, `${RESTRICTED_ITEM_ID} introuvable dans ${type}.yml`).to.not
        .be.undefined;
      expect(item?.restricted).to.be.true;
    });
  }

  it("should never mark an item both restricted and disabled", async () => {
    // Un item `disabled` n'est jamais inscriptible en base : le marquer
    // `restricted` donnerait un droit que personne ne peut exercer.
    const checklists = await Promise.all(
      allowedChecklists.map((type) => getChecklistObject(type)),
    );
    const items = checklists.flatMap((checklist) =>
      (checklist ?? []).flatMap((section) => section.items),
    );
    const both = items
      .filter((i) => i.restricted && i.disabled)
      .map((i) => i.id);
    expect(both).to.deep.equal([]);
  });
});
