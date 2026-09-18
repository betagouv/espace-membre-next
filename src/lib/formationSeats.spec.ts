import { expect } from "chai";

import { libelleInscriptions } from "@/lib/formationSeats";

describe("libelleInscriptions", () => {
  it("affiche une fraction quand la session a une limite", () => {
    expect(libelleInscriptions(3, 12)).to.equal("3/12");
  });

  it("annonce le décompte seul sans limite", () => {
    expect(libelleInscriptions(12)).to.equal("12 inscrit·es");
  });

  it("accorde le singulier", () => {
    expect(libelleInscriptions(1)).to.equal("1 inscrit·e");
  });

  it("traite une limite nulle comme une absence de limite", () => {
    // Grist renvoie 0 pour une capacité vide : la fraction « 5/0 » n'aurait
    // aucun sens.
    expect(libelleInscriptions(5, 0)).to.equal("5 inscrit·es");
  });

  it("dit zéro sans limite plutôt que de rester muet", () => {
    expect(libelleInscriptions(0)).to.equal("0 inscrit·e");
  });
});
