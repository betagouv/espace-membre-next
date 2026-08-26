import { expect } from "chai";

import { formationSessionDates } from "@/lib/formationRecurrence";
import { FORMATION_RECURRENCE } from "@/models/formationsGrist";

const jours = (dates: string[]) => dates.map((d) => d.slice(0, 10));

describe("formationSessionDates", () => {
  const first = "2026-09-01T09:00";

  it("ne renvoie que la date de départ sans récurrence", () => {
    const dates = formationSessionDates(first, FORMATION_RECURRENCE.AUCUNE, 5);
    expect(jours(dates)).to.deep.equal(["2026-09-01"]);
  });

  it("espace d'une semaine", () => {
    const dates = formationSessionDates(
      first,
      FORMATION_RECURRENCE.HEBDOMADAIRE,
      3,
    );
    expect(jours(dates)).to.deep.equal([
      "2026-09-01",
      "2026-09-08",
      "2026-09-15",
    ]);
  });

  it("espace de deux semaines", () => {
    const dates = formationSessionDates(
      first,
      FORMATION_RECURRENCE.BIMENSUELLE,
      3,
    );
    expect(jours(dates)).to.deep.equal([
      "2026-09-01",
      "2026-09-15",
      "2026-09-29",
    ]);
  });

  it("espace d'un mois en gardant le quantième", () => {
    const dates = formationSessionDates(
      first,
      FORMATION_RECURRENCE.MENSUELLE,
      3,
    );
    expect(jours(dates)).to.deep.equal([
      "2026-09-01",
      "2026-10-01",
      "2026-11-01",
    ]);
  });

  it("ramène au dernier jour du mois quand le quantième n'existe pas", () => {
    const dates = formationSessionDates(
      "2027-01-31T09:00",
      FORMATION_RECURRENCE.MENSUELLE,
      2,
    );
    expect(jours(dates)).to.deep.equal(["2027-01-31", "2027-02-28"]);
  });

  it("conserve l'heure d'une occurrence à l'autre", () => {
    const dates = formationSessionDates(
      first,
      FORMATION_RECURRENCE.HEBDOMADAIRE,
      2,
    );
    expect(dates).to.deep.equal(["2026-09-01T09:00", "2026-09-08T09:00"]);
  });

  it("garde l'heure murale au passage à l'heure d'hiver", () => {
    // Le 25 octobre 2026, Paris recule d'une heure. Une série mensuelle partie
    // de 14 h doit rester à 14 h, et non glisser à 13 h.
    const dates = formationSessionDates(
      "2026-10-05T14:00",
      FORMATION_RECURRENCE.MENSUELLE,
      3,
    );
    expect(dates).to.deep.equal([
      "2026-10-05T14:00",
      "2026-11-05T14:00",
      "2026-12-05T14:00",
    ]);
  });

  it("refuse un nombre d'occurrences absurde en renvoyant au moins une date", () => {
    const dates = formationSessionDates(
      first,
      FORMATION_RECURRENCE.HEBDOMADAIRE,
      0,
    );
    expect(jours(dates)).to.deep.equal(["2026-09-01"]);
  });
});
