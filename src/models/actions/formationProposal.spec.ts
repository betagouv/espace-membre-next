import { expect } from "chai";

import {
  formationProposalSchema,
  formationUpdateSchema,
} from "@/models/actions/formationProposal";
import { FORMATION_MODALITE } from "@/models/formationsGrist";

// Une proposition complète, en présentiel : chaque test n'en change que ce
// qu'il éprouve.
const proposition = {
  titre: "Atelier",
  description: "Une description",
  modalite: FORMATION_MODALITE.PRESENTIEL,
  thematiques: ["Design"],
  audience: ["Tout public"],
  dateDebut: "2026-10-01T14:00",
  adresse: "20 avenue de Ségur, 75007 Paris",
  duree: "1h",
  animateur: "Camille",
  emailOrganisateur: "camille@beta.gouv.fr",
  // Une illustration de la banque dispense d'envoyer un fichier.
  imageId: "4",
};

const erreursSur = (result: {
  success: boolean;
  error?: { issues: { path: (string | number)[] }[] };
}) => (result.error?.issues ?? []).map((issue) => issue.path.join("."));

describe("formationProposalSchema", () => {
  it("accepte une formation datée", () => {
    expect(formationProposalSchema.safeParse(proposition).success).to.equal(
      true,
    );
  });

  it("exige une date hors e-learning", () => {
    const result = formationProposalSchema.safeParse({
      ...proposition,
      dateDebut: undefined,
    });
    expect(erreursSur(result)).to.deep.equal(["dateDebut"]);
  });

  it("exige l'adresse en présentiel", () => {
    const result = formationProposalSchema.safeParse({
      ...proposition,
      adresse: "  ",
    });
    expect(erreursSur(result)).to.deep.equal(["adresse"]);
  });

  it("n'exige pas d'adresse à distance, mais le lien de visio", () => {
    const result = formationProposalSchema.safeParse({
      ...proposition,
      modalite: FORMATION_MODALITE.DISTANCIEL,
      adresse: undefined,
    });
    expect(erreursSur(result)).to.deep.equal(["lienVisioAdmin"]);
  });

  it("accepte un e-learning sans date, avec son lien", () => {
    const result = formationProposalSchema.safeParse({
      ...proposition,
      modalite: FORMATION_MODALITE.E_LEARNING,
      dateDebut: undefined,
      lienSupport: "https://www.fun-mooc.fr/fr/cours/accessibilite-numerique/",
    });
    expect(result.success).to.equal(true);
  });

  it("exige le lien de la formation pour un e-learning", () => {
    const result = formationProposalSchema.safeParse({
      ...proposition,
      modalite: FORMATION_MODALITE.E_LEARNING,
      dateDebut: undefined,
    });
    expect(erreursSur(result)).to.deep.equal(["lienSupport"]);
  });

  it("refuse un lien qui n'est pas du http(s)", () => {
    // `new URL()` sait lire « javascript: » : c'est le cas que le lien
    // devenu bouton ne doit jamais laisser passer.
    const result = formationProposalSchema.safeParse({
      ...proposition,
      modalite: FORMATION_MODALITE.E_LEARNING,
      dateDebut: undefined,
      lienSupport: "javascript:alert(1)",
    });
    expect(erreursSur(result)).to.include("lienSupport");
  });
});

describe("formationUpdateSchema", () => {
  const modification = {
    ...proposition,
    formationId: "7",
    dateDebut: undefined,
    imageId: undefined,
  };

  it("exige aussi l'adresse en présentiel à la modification", () => {
    const result = formationUpdateSchema.safeParse({
      ...modification,
      adresse: undefined,
    });
    expect(erreursSur(result)).to.deep.equal(["adresse"]);
  });

  it("exige aussi le lien d'un e-learning à la modification", () => {
    const result = formationUpdateSchema.safeParse({
      ...modification,
      modalite: FORMATION_MODALITE.E_LEARNING,
    });
    expect(erreursSur(result)).to.deep.equal(["lienSupport"]);
  });

  it("n'exige pas de date à la modification", () => {
    expect(formationUpdateSchema.safeParse(modification).success).to.equal(
      true,
    );
  });
});
