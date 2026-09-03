import { expect } from "chai";

import { comparerAuCatalogue, rangCatalogue } from "@/lib/formationOrder";

const datee = (name: string, jours: number) => ({
  name,
  isELearning: false,
  start: new Date(Date.now() + jours * 86_400_000),
});
const sansDate = (name: string) => ({
  name,
  isELearning: false,
  start: undefined,
});
const eLearning = (name: string) => ({
  name,
  isELearning: true,
  start: undefined,
});

describe("rangCatalogue", () => {
  it("place les dates à venir en tête", () => {
    expect(rangCatalogue(datee("a", 1))).to.equal(0);
  });
  it("place les formations sans date au milieu", () => {
    expect(rangCatalogue(sansDate("a"))).to.equal(1);
  });
  it("place les e-learning en dernier, même datés", () => {
    expect(rangCatalogue(eLearning("a"))).to.equal(2);
    expect(rangCatalogue({ ...datee("a", 1), isELearning: true })).to.equal(2);
  });
});

describe("comparerAuCatalogue", () => {
  it("trie les dates de la plus proche à la plus lointaine", () => {
    const tri = [datee("loin", 30), datee("proche", 2)].sort(
      comparerAuCatalogue,
    );
    expect(tri.map((c) => c.name)).to.deep.equal(["proche", "loin"]);
  });

  it("range une date avant une formation sans date, elle-même avant un e-learning", () => {
    const tri = [eLearning("e"), sansDate("s"), datee("d", 5)].sort(
      comparerAuCatalogue,
    );
    expect(tri.map((c) => c.name)).to.deep.equal(["d", "s", "e"]);
  });

  it("trie les e-learning par titre, accents compris", () => {
    const tri = [eLearning("Écoconception"), eLearning("Accessibilité")].sort(
      comparerAuCatalogue,
    );
    expect(tri.map((c) => c.name)).to.deep.equal([
      "Accessibilité",
      "Écoconception",
    ]);
  });

  it("garde les e-learning en queue quel que soit l'ordre d'entrée", () => {
    const entree = [
      eLearning("e1"),
      datee("d2", 9),
      eLearning("e2"),
      sansDate("s1"),
      datee("d1", 1),
    ];
    const tri = [...entree].sort(comparerAuCatalogue);
    expect(tri.map((c) => c.name)).to.deep.equal([
      "d1",
      "d2",
      "s1",
      "e1",
      "e2",
    ]);
  });
});
