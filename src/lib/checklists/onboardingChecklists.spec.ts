import { expect } from "chai";

import {
  allowedChecklists,
  getChecklistObject,
  getOnboardingChecklistType,
  ONBOARDING_INTRAPRENEUR_START,
} from "./getChecklistObject";
import { checklistSchemaType } from "@/models/checklist";
import { Domaine } from "@/models/member";

const itemsOf = (checklist: checklistSchemaType | null) =>
  (checklist ?? []).flatMap((section) => section.items);

const DAY = 24 * 60 * 60 * 1000;
const beforeStart = new Date(ONBOARDING_INTRAPRENEUR_START.getTime() - DAY);
const afterStart = new Date(ONBOARDING_INTRAPRENEUR_START.getTime() + DAY);

describe("onboarding checklists", () => {
  it("should give new intrapreneurs their own onboarding checklist", () => {
    for (const createdAt of [ONBOARDING_INTRAPRENEUR_START, afterStart]) {
      expect(
        getOnboardingChecklistType(Domaine.INTRAPRENARIAT, createdAt),
      ).to.equal("onboarding-intrapreneur");
    }
  });

  it("should keep the common onboarding checklist for intrapreneurs who arrived before", () => {
    // Leur embarquement est déjà entamé sur la checklist commune.
    expect(
      getOnboardingChecklistType(Domaine.INTRAPRENARIAT, beforeStart),
    ).to.equal("onboarding");
  });

  it("should give every other domaine the common onboarding checklist", () => {
    const others = Object.values(Domaine).filter(
      (domaine) => domaine !== Domaine.INTRAPRENARIAT,
    );
    for (const domaine of others) {
      expect(getOnboardingChecklistType(domaine, afterStart), domaine).to.equal(
        "onboarding",
      );
    }
  });

  it("should not repeat an item id within a checklist", async () => {
    // Un id en double compterait deux fois dans la progression.
    for (const type of allowedChecklists) {
      const ids = itemsOf(await getChecklistObject(type)).map((i) => i.id);
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      expect(duplicates, type).to.deep.equal([]);
    }
  });

  it("should keep a single pre-checked item in each onboarding checklist", async () => {
    // getUserChecklists et la fiche membre ajoutent 1 à la progression de
    // l'embarquement pour la fiche membre, cochée d'office et jamais en base.
    for (const type of ["onboarding", "onboarding-intrapreneur"] as const) {
      const disabled = itemsOf(await getChecklistObject(type)).filter(
        (i) => i.disabled,
      );
      expect(
        disabled.map((i) => i.id),
        type,
      ).to.deep.equal(["onboarding-fiche-membre"]);
      expect(disabled[0].defaultValue, type).to.be.true;
    }
  });

  it("should keep the same rights on items shared by both onboarding checklists", async () => {
    // Les droits d'écriture sont calculés sur l'union des yml : un item
    // réservé dans l'un et libre dans l'autre serait réservé partout.
    const [common, intrapreneur] = await Promise.all([
      getChecklistObject("onboarding"),
      getChecklistObject("onboarding-intrapreneur"),
    ]);
    const commonItems = new Map(itemsOf(common).map((i) => [i.id, i]));
    const shared = itemsOf(intrapreneur).filter((i) => commonItems.has(i.id));

    expect(shared).to.not.be.empty;
    for (const item of shared) {
      const commonItem = commonItems.get(item.id)!;
      expect(!!item.restricted, `${item.id} restricted`).to.equal(
        !!commonItem.restricted,
      );
      expect(!!item.disabled, `${item.id} disabled`).to.equal(
        !!commonItem.disabled,
      );
    }
  });
});
