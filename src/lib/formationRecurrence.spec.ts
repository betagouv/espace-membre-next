import { expect } from "chai";

import { formationSessionDates } from "@/lib/formationRecurrence";
import { FORMATION_FREQUENCE } from "@/models/formationsGrist";

const LUNDI = 1;
const MARDI = 2;

describe("formationSessionDates", () => {
  // Mardi 1er septembre 2026.
  const first = "2026-09-01T09:00";

  it("ne renvoie que la date de départ sans récurrence", () => {
    expect(
      formationSessionDates(first, {
        frequence: FORMATION_FREQUENCE.AUCUNE,
        occurrences: 5,
      }),
    ).to.deep.equal(["2026-09-01T09:00"]);
  });

  it("espace d'une semaine", () => {
    expect(
      formationSessionDates(first, {
        frequence: FORMATION_FREQUENCE.SEMAINE,
        occurrences: 3,
      }),
    ).to.deep.equal([
      "2026-09-01T09:00",
      "2026-09-08T09:00",
      "2026-09-15T09:00",
    ]);
  });

  it("espace de N semaines", () => {
    expect(
      formationSessionDates(first, {
        frequence: FORMATION_FREQUENCE.SEMAINE,
        intervalle: 3,
        occurrences: 3,
      }),
    ).to.deep.equal([
      "2026-09-01T09:00",
      "2026-09-22T09:00",
      "2026-10-13T09:00",
    ]);
  });

  it("espace de N mois", () => {
    expect(
      formationSessionDates(first, {
        frequence: FORMATION_FREQUENCE.MOIS,
        intervalle: 2,
        occurrences: 3,
      }),
    ).to.deep.equal([
      "2026-09-01T09:00",
      "2026-11-01T09:00",
      "2027-01-01T09:00",
    ]);
  });

  it("avance la série au jour de la semaine demandé", () => {
    // Le 1er septembre 2026 est un mardi : le premier lundi suivant est le 7.
    expect(
      formationSessionDates(first, {
        frequence: FORMATION_FREQUENCE.SEMAINE,
        jour: LUNDI,
        occurrences: 3,
      }),
    ).to.deep.equal([
      "2026-09-07T09:00",
      "2026-09-14T09:00",
      "2026-09-21T09:00",
    ]);
  });

  it("ne décale pas la date quand elle tombe déjà le bon jour", () => {
    expect(
      formationSessionDates(first, {
        frequence: FORMATION_FREQUENCE.SEMAINE,
        jour: MARDI,
        occurrences: 2,
      }),
    ).to.deep.equal(["2026-09-01T09:00", "2026-09-08T09:00"]);
  });

  it("reconduit le rang du jour dans le mois", () => {
    // 14 septembre 2026 : deuxième lundi du mois. Les occurrences suivantes
    // doivent être les deuxièmes lundis d'octobre et novembre.
    expect(
      formationSessionDates("2026-09-14T10:00", {
        frequence: FORMATION_FREQUENCE.MOIS,
        jour: LUNDI,
        occurrences: 3,
      }),
    ).to.deep.equal([
      "2026-09-14T10:00",
      "2026-10-12T10:00",
      "2026-11-09T10:00",
    ]);
  });

  it("prend le dernier du mois quand le rang n'existe pas", () => {
    // 29 septembre 2026 : cinquième mardi. Octobre 2026 n'a que quatre mardis,
    // le dernier étant le 27.
    expect(
      formationSessionDates("2026-09-29T10:00", {
        frequence: FORMATION_FREQUENCE.MOIS,
        jour: MARDI,
        occurrences: 2,
      }),
    ).to.deep.equal(["2026-09-29T10:00", "2026-10-27T10:00"]);
  });

  it("garde le quantième en mensuel sans jour imposé", () => {
    expect(
      formationSessionDates("2027-01-31T09:00", {
        frequence: FORMATION_FREQUENCE.MOIS,
        occurrences: 2,
      }),
    ).to.deep.equal(["2027-01-31T09:00", "2027-02-28T09:00"]);
  });

  it("garde l'heure murale au passage à l'heure d'hiver", () => {
    // Le 25 octobre 2026, Paris recule d'une heure. Une série mensuelle partie
    // de 14 h doit rester à 14 h, et non glisser à 13 h.
    expect(
      formationSessionDates("2026-10-05T14:00", {
        frequence: FORMATION_FREQUENCE.MOIS,
        occurrences: 3,
      }),
    ).to.deep.equal([
      "2026-10-05T14:00",
      "2026-11-05T14:00",
      "2026-12-05T14:00",
    ]);
  });

  it("ignore le jour imposé quand il n'y a pas de récurrence", () => {
    expect(
      formationSessionDates(first, {
        frequence: FORMATION_FREQUENCE.AUCUNE,
        jour: LUNDI,
      }),
    ).to.deep.equal(["2026-09-01T09:00"]);
  });

  it("renvoie au moins une date pour des paramètres absurdes", () => {
    expect(
      formationSessionDates(first, {
        frequence: FORMATION_FREQUENCE.SEMAINE,
        intervalle: 0,
        occurrences: 0,
      }),
    ).to.deep.equal(["2026-09-01T09:00"]);
  });

  it("renvoie une liste vide sur une date illisible", () => {
    expect(
      formationSessionDates("pas une date", {
        frequence: FORMATION_FREQUENCE.SEMAINE,
        occurrences: 3,
      }),
    ).to.deep.equal([]);
  });
});
