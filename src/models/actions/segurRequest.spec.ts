import { expect } from "chai";
import { addDays, format } from "date-fns";

import { segurRequestSchema } from "./segurRequest";
import { SEGUR_DEMANDE_TYPE } from "../segur";

const dansJours = (jours: number) =>
  format(addDays(new Date(), jours), "yyyy-MM-dd");

const demandeur = {
  prenomNom: "Ada Lovelace",
  email: "ada@beta.gouv.fr",
  startupName: "Espace Membre",
};

const champsEnErreur = (data: unknown) => {
  const result = segurRequestSchema.safeParse(data);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.path.join("."));
};

describe("segurRequestSchema", () => {
  it("should require the request type", () => {
    expect(champsEnErreur(demandeur)).to.include("typeDemande");
  });

  describe("demande d'accès", () => {
    const acces = {
      ...demandeur,
      typeDemande: SEGUR_DEMANDE_TYPE.ACCES,
      dateDebut: dansJours(7),
      dateFin: dansJours(14),
    };

    it("should accept a request made more than 48 h ahead", () => {
      expect(champsEnErreur(acces)).to.deep.equal([]);
    });

    it("should refuse a visit less than 48 h ahead", () => {
      expect(champsEnErreur({ ...acces, dateDebut: dansJours(1) })).to.include(
        "dateDebut",
      );
    });

    it("should refuse a request covering more than three months", () => {
      expect(champsEnErreur({ ...acces, dateFin: dansJours(130) })).to.include(
        "dateFin",
      );
    });

    it("should not ask for meeting room fields", () => {
      const champs = champsEnErreur({ ...acces, datesReunion: [{ date: "" }] });
      expect(champs).to.deep.equal([]);
    });
  });

  describe("demande de salle de réunion", () => {
    const reunion = {
      ...demandeur,
      typeDemande: SEGUR_DEMANDE_TYPE.SALLE_REUNION,
      datesReunion: [{ date: dansJours(3) }],
      heureDebut: "10:00",
      heureFin: "12:00",
      nbParticipants: 2,
      autresMembres: [{ prenomNom: "Alan Turing", email: "alan@beta.gouv.fr" }],
    };

    it("should accept a complete booking without access dates", () => {
      expect(champsEnErreur(reunion)).to.deep.equal([]);
    });

    it("should require at least one date", () => {
      expect(
        champsEnErreur({ ...reunion, datesReunion: [{ date: "" }] }),
      ).to.include("datesReunion.0.date");
    });

    it("should refuse an end time before the start time", () => {
      expect(champsEnErreur({ ...reunion, heureFin: "09:00" })).to.include(
        "heureFin",
      );
    });

    it("should refuse fewer participants than people named", () => {
      expect(champsEnErreur({ ...reunion, nbParticipants: 1 })).to.include(
        "nbParticipants",
      );
    });
  });
});
