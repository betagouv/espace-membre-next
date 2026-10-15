import { expect } from "chai";

import { computeWaitingListChanges } from "@/lib/formationsGrist";
import { GRIST_INSCRIPTIONS_COLUMNS } from "@/models/formationsGrist";

type Inscription = { id: number; fields: Record<string, unknown> };

const inscription = (
  id: number,
  createdAt: string | undefined,
  surListeDAttente: boolean,
): Inscription => ({
  id,
  fields: {
    [GRIST_INSCRIPTIONS_COLUMNS.createdAt]: createdAt,
    [GRIST_INSCRIPTIONS_COLUMNS.surListeDAttente]: surListeDAttente,
  },
});

describe("computeWaitingListChanges", () => {
  it("bascule les dernières inscriptions quand la capacité baisse", () => {
    const inscriptions = [
      inscription(1, "2026-01-01T10:00:00.000Z", false),
      inscription(2, "2026-01-02T10:00:00.000Z", false),
      inscription(3, "2026-01-03T10:00:00.000Z", false),
    ];

    expect(computeWaitingListChanges(inscriptions, 1)).to.deep.equal([
      { id: 2, shouldWait: true },
      { id: 3, shouldWait: true },
    ]);
  });

  it("repêche la liste d'attente quand la capacité remonte", () => {
    const inscriptions = [
      inscription(1, "2026-01-01T10:00:00.000Z", false),
      inscription(2, "2026-01-02T10:00:00.000Z", true),
      inscription(3, "2026-01-03T10:00:00.000Z", true),
    ];

    expect(computeWaitingListChanges(inscriptions, 3)).to.deep.equal([
      { id: 2, shouldWait: false },
      { id: 3, shouldWait: false },
    ]);
  });

  it("ne renvoie rien quand les drapeaux sont déjà justes", () => {
    const inscriptions = [
      inscription(1, "2026-01-01T10:00:00.000Z", false),
      inscription(2, "2026-01-02T10:00:00.000Z", true),
    ];

    expect(computeWaitingListChanges(inscriptions, 1)).to.deep.equal([]);
  });

  it("traite une capacité absente ou nulle comme illimitée", () => {
    const inscriptions = [
      inscription(1, "2026-01-01T10:00:00.000Z", true),
      inscription(2, "2026-01-02T10:00:00.000Z", true),
    ];

    for (const capacite of [null, undefined, 0]) {
      expect(computeWaitingListChanges(inscriptions, capacite)).to.deep.equal([
        { id: 1, shouldWait: false },
        { id: 2, shouldWait: false },
      ]);
    }
  });

  it("classe par date d'inscription, pas par ordre d'arrivée dans le tableau", () => {
    const inscriptions = [
      inscription(9, "2026-03-01T10:00:00.000Z", false),
      inscription(4, "2026-01-01T10:00:00.000Z", true),
    ];

    // La ligne 4 s'est inscrite en premier : c'est elle qui garde la place.
    expect(computeWaitingListChanges(inscriptions, 1)).to.deep.equal([
      { id: 4, shouldWait: false },
      { id: 9, shouldWait: true },
    ]);
  });

  it("départage les dates identiques par identifiant de ligne", () => {
    const sameDate = "2026-01-01T10:00:00.000Z";
    const inscriptions = [
      inscription(30, sameDate, false),
      inscription(10, sameDate, false),
      inscription(20, sameDate, false),
    ];

    expect(computeWaitingListChanges(inscriptions, 2)).to.deep.equal([
      { id: 30, shouldWait: true },
    ]);
  });

  it("comprend les dates au format PostgreSQL des lignes reprises", () => {
    const inscriptions = [
      inscription(1, "2025-07-21 21:01:46.357407+02:00", false),
      inscription(2, "2025-07-20 09:00:00+02:00", false),
    ];

    // La ligne 2 est antérieure d'un jour : elle passe devant.
    expect(computeWaitingListChanges(inscriptions, 1)).to.deep.equal([
      { id: 1, shouldWait: true },
    ]);
  });

  it("ne déclasse personne quand la date est illisible", () => {
    const inscriptions = [
      inscription(1, "pas une date", false),
      inscription(2, undefined, false),
      inscription(3, "2026-01-01T10:00:00.000Z", false),
    ];

    // Les dates illisibles valent « la plus ancienne » : les places acquises
    // ne bougent pas à cause d'un défaut de saisie.
    expect(computeWaitingListChanges(inscriptions, 2)).to.deep.equal([
      { id: 3, shouldWait: true },
    ]);
  });
});
