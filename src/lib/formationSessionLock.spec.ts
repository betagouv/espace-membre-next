import { expect } from "chai";

import { withFormationSessionLock } from "@/lib/formationSessionLock";

/**
 * Le verrou est ce qui empêche deux inscriptions simultanées de se croire
 * toutes deux dans la capacité. Il tape une vraie base : un test qui simulerait
 * Postgres ne prouverait rien, puisque c'est précisément la sérialisation par
 * la base qu'on vérifie.
 */
describe("withFormationSessionLock", () => {
  it("sérialise deux opérations sur la même session", async () => {
    const trace: string[] = [];
    const operation = (nom: string) => async () => {
      trace.push(`${nom}:debut`);
      await new Promise((resolve) => setTimeout(resolve, 150));
      trace.push(`${nom}:fin`);
    };

    await Promise.all([
      withFormationSessionLock(1, operation("a")),
      withFormationSessionLock(1, operation("b")),
    ]);

    // Jamais entrelacé : chaque opération finit avant que l'autre commence.
    expect(trace).to.have.lengthOf(4);
    expect(trace[1]).to.equal(`${trace[0].split(":")[0]}:fin`);
    expect(trace[3]).to.equal(`${trace[2].split(":")[0]}:fin`);
  });

  it("ne bloque pas deux sessions différentes", async () => {
    const trace: string[] = [];
    const operation = (nom: string) => async () => {
      trace.push(`${nom}:debut`);
      await new Promise((resolve) => setTimeout(resolve, 150));
      trace.push(`${nom}:fin`);
    };

    await Promise.all([
      withFormationSessionLock(10, operation("a")),
      withFormationSessionLock(11, operation("b")),
    ]);

    // Deux sessions distinctes n'ont aucune raison de s'attendre : les deux
    // débuts arrivent avant la première fin.
    expect(trace.slice(0, 2)).to.have.members(["a:debut", "b:debut"]);
  });

  it("renvoie la valeur de l'opération et relâche le verrou", async () => {
    const valeur = await withFormationSessionLock(2, async () => "inscrit");
    expect(valeur).to.equal("inscrit");

    // Si le verrou n'était pas relâché au COMMIT, cette seconde prise
    // échouerait après ses quatre essais.
    const suivante = await withFormationSessionLock(2, async () => "encore");
    expect(suivante).to.equal("encore");
  });

  it("relâche le verrou quand l'opération échoue", async () => {
    try {
      await withFormationSessionLock(3, async () => {
        throw new Error("Grist a refusé");
      });
      expect.fail("l'erreur de l'opération doit remonter");
    } catch (error) {
      expect((error as Error).message).to.equal("Grist a refusé");
    }

    // Le ROLLBACK doit avoir rendu le verrou : sinon la session resterait
    // bloquée pour tout le monde après la moindre erreur Grist.
    const apres = await withFormationSessionLock(3, async () => "libre");
    expect(apres).to.equal("libre");
  });
});
