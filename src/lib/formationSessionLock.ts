import { BusinessError } from "@/lib/error";
import { db, sql } from "@/lib/kysely";

// Les verrous consultatifs sont globaux à la base : la première clé réserve un
// espace de noms aux inscriptions aux formations, la seconde porte l'identifiant
// de la session. Sans cette séparation, un futur pg_advisory_lock posé sur le
// même entier bloquerait des opérations qui n'ont rien à voir.
const CLE_VERROU_INSCRIPTIONS = 424242;

// Quatre essais, ~850 ms au pire : le temps qu'une inscription concurrente
// finisse ses allers-retours Grist. L'attente se fait SANS tenir de connexion,
// contrairement à un pg_advisory_xact_lock bloquant : le pool Postgres n'a que
// dix connexions par défaut, et une rafale de demandes simultanées les
// immobiliserait toutes — on figerait l'application entière pour corriger un
// surbooking.
const ATTENTES_MS = [0, 100, 250, 500];

/**
 * Sérialise les opérations qui lisent puis réécrivent les inscriptions d'une
 * session de formation.
 *
 * Le catalogue vit dans Grist, qui n'offre ni transaction, ni écriture
 * conditionnelle, ni contrainte d'unicité : deux demandes simultanées lisent le
 * même décompte, se croient toutes deux dans la capacité, et la session part en
 * surbooking. Postgres, lui, est déjà sur le chemin de chaque requête
 * authentifiée : c'est le seul point de rendez-vous disponible.
 *
 * Le verrou est pris en base et non en mémoire parce que l'application tourne
 * sur plusieurs conteneurs : un mutex de processus n'en protégerait qu'un.
 *
 * Il est lié à la transaction : il se relâche au COMMIT comme au ROLLBACK, donc
 * une erreur Grist au milieu ne le laisse pas coincé.
 *
 * `operation` doit rester courte — juste la lecture, la décision et l'écriture.
 * Tout ce qui peut être préparé avant (identité, configuration de la session,
 * adresse de contact) doit l'être : chaque milliseconde ici est une connexion
 * du pool retenue.
 *
 * À ne jamais appeler depuis l'intérieur d'un verrou portant la même session :
 * la prise imbriquée passerait par une autre connexion du pool et échouerait.
 */
export async function withFormationSessionLock<T>(
  sessionRowId: number,
  operation: () => Promise<T>,
): Promise<T> {
  for (const attente of ATTENTES_MS) {
    if (attente) {
      await new Promise((resolve) => setTimeout(resolve, attente));
    }

    // L'enveloppe { valeur } distingue « verrou refusé » d'une opération qui
    // renvoie légitimement undefined.
    const resultat = await db.transaction().execute(async (trx) => {
      const { rows } = await sql<{ pris: boolean }>`
        select pg_try_advisory_xact_lock(
          ${CLE_VERROU_INSCRIPTIONS}::int, ${sessionRowId}::int
        ) as pris
      `.execute(trx);
      if (!rows[0]?.pris) return undefined;
      return { valeur: await operation() };
    });

    if (resultat) return resultat.valeur;
  }

  throw new BusinessError(
    "InscriptionsSimultanees",
    "Plusieurs inscriptions sont en cours sur cette date, réessaie dans un instant.",
  );
}
