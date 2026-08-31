"use server";

import { fromZonedTime } from "date-fns-tz";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import {
  canManageFormation,
  isFormationAnimator,
} from "@/lib/canManageFormation";
import {
  fetchGristFormationById,
  syncSessionWaitingList,
} from "@/lib/formationsGrist";
import {
  addGristRecords,
  deleteGristRecords,
  getGristRecords,
  GristRecordFields,
  updateGristRecords,
  uploadGristAttachments,
} from "@/lib/grist";
import { formationSessionDates } from "@/lib/formationRecurrence";
import { isAnimationTeamMember } from "@/lib/isAnimationTeamMember";
import {
  formationProposalSchema,
  formationProposalSchemaType,
  formationScheduleSchema,
  formationScheduleSchemaType,
  formationSessionUpdateSchema,
  formationSessionUpdateSchemaType,
  getImageFile,
  formationUpdateSchema,
  formationUpdateSchemaType,
} from "@/models/actions/formationProposal";
import {
  FORMATION_DUREES,
  FORMATION_STATUT,
  GRIST_ANNULATIONS_COLUMNS,
  GRIST_FORMATIONS_COLUMNS,
  GRIST_SUPPRESSIONS_AGENDA_COLUMNS,
  GRIST_INSCRIPTIONS_COLUMNS,
  GRIST_SESSIONS_COLUMNS,
  uidEvenementAnimation,
  uidEvenementInscription,
} from "@/models/formationsGrist";
import config from "@/server/config";
import { authOptions } from "@/lib/authoptions";
import { db } from "@/lib/kysely";
import {
  AuthorizationError,
  BusinessError,
  withErrorHandling,
} from "@/lib/error";

// Le champ datetime-local du formulaire ne porte pas de fuseau : « 14:00 »
// veut dire 14 h à Paris, pas 14 h dans le fuseau du serveur (UTC en
// conteneur). Sans cette conversion, une formation se décale d'une heure.
const PARIS_TZ = "Europe/Paris";
const parisDateToEpochSeconds = (value: string): number =>
  Math.floor(fromZonedTime(value, PARIS_TZ).getTime() / 1000);

// La table Membres est indexée sur le ghid (= username). Renvoie l'id de ligne,
// ou 0 (référence vide côté Grist) si la personne n'y est pas. Simple lecture :
// à réserver aux ghid devinés (partie locale d'une adresse Tchap saisie à la
// main), qu'on ne veut surtout pas transformer en lignes.
async function findMembreRowId(ghid: string | undefined): Promise<number> {
  if (!ghid || !config.GRIST_FORMATIONS_DOC_ID) return 0;
  const membres = await getGristRecords(
    config.GRIST_FORMATIONS_DOC_ID,
    config.GRIST_FORMATIONS_MEMBRES_TABLE_ID,
    { ghid: [ghid] },
  );
  return membres[0]?.id ?? 0;
}

/**
 * Identifiant de ligne dans la table Membres, indexée sur le ghid (= username).
 *
 * La table a été peuplée par un import : toute personne arrivée depuis en est
 * absente, et sans ligne il n'y a pas d'inscription possible. On la crée donc
 * au passage plutôt que de dépendre d'une resynchronisation.
 *
 * Renvoie 0 (référence vide côté Grist) si la création échoue ou si le
 * document n'est pas configuré.
 */
async function findOrCreateMembreRowId(
  ghid: string | undefined,
): Promise<number> {
  if (!ghid || !config.GRIST_FORMATIONS_DOC_ID) return 0;
  const docId = config.GRIST_FORMATIONS_DOC_ID;

  const existing = await findMembreRowId(ghid);
  if (existing) return existing;

  // Le nom complet vient de l'annuaire interne ; à défaut, le ghid fait
  // l'affaire : mieux vaut une ligne au nom technique que pas d'inscription.
  const user = await db
    .selectFrom("users")
    .select("fullname")
    .where("username", "=", ghid)
    .executeTakeFirst();

  const [createdId] = await addGristRecords(
    docId,
    config.GRIST_FORMATIONS_MEMBRES_TABLE_ID,
    [{ ghid, name: user?.fullname || ghid }],
  );
  return createdId ?? 0;
}

export const submitFormationProposal = withErrorHandling(
  async (data: formationProposalSchemaType) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthorizationError("Tu dois être connecté·e.");
    }

    const parsed = formationProposalSchema.parse(data);

    if (!config.GRIST_API_KEY || !config.GRIST_FORMATIONS_DOC_ID) {
      throw new BusinessError(
        "gristNotConfigured",
        "L'intégration Grist n'est pas configurée (GRIST_API_KEY / GRIST_FORMATIONS_DOC_ID).",
      );
    }

    // Le statut est décidé ici, jamais par le client : l'équipe d'animation
    // crée une formation directement validée, un membre la propose.
    const isAnimation = await isAnimationTeamMember(session.user);
    const statut = isAnimation
      ? FORMATION_STATUT.VALIDEE
      : FORMATION_STATUT.PROPOSEE;

    const referentRowId = await findOrCreateMembreRowId(session.user.id);

    // L'illustration passe par le magasin de pièces jointes du document : la
    // colonne Image ne stocke que des identifiants.
    // Une illustration de la banque est déjà dans le magasin de pièces jointes
    // du document : on la référence, sans la dupliquer.
    const image = getImageFile(parsed.image);
    const attachmentIds = parsed.imageId
      ? [Number(parsed.imageId)].filter(Number.isInteger)
      : image && image.size > 0
        ? await uploadGristAttachments(config.GRIST_FORMATIONS_DOC_ID, [image])
        : [];
    const dureeHeures =
      FORMATION_DUREES.find((d) => d.label === parsed.duree)?.hours ?? null;

    const fields: GristRecordFields = {
      [GRIST_FORMATIONS_COLUMNS.titre]: parsed.titre,
      [GRIST_FORMATIONS_COLUMNS.description]: parsed.description,
      [GRIST_FORMATIONS_COLUMNS.modalite]: parsed.modalite,
      // Les ChoiceList passent par l'API records au format ["L", ...valeurs].
      [GRIST_FORMATIONS_COLUMNS.thematiques]: ["L", ...parsed.thematiques],
      [GRIST_FORMATIONS_COLUMNS.audience]: ["L", ...parsed.audience],
      [GRIST_FORMATIONS_COLUMNS.capacite]: parsed.capacite ?? null,
      [GRIST_FORMATIONS_COLUMNS.duree]: dureeHeures,
      [GRIST_FORMATIONS_COLUMNS.referent]: referentRowId,
      [GRIST_FORMATIONS_COLUMNS.statut]: statut,
      [GRIST_FORMATIONS_COLUMNS.lienAdmin]: parsed.lienVisioAdmin ?? "",
      [GRIST_FORMATIONS_COLUMNS.lienSupport]: parsed.lienSupport ?? "",
      [GRIST_FORMATIONS_COLUMNS.lienFeedback]: parsed.lienFeedback ?? "",
      [GRIST_FORMATIONS_COLUMNS.animateur]: parsed.animateur,
      // Plus demandée au formulaire : l'adresse de qui dépose sert à
      // reconnaître l'animateur·ice, comme le faisait la valeur pré-remplie.
      [GRIST_FORMATIONS_COLUMNS.animateurTchap]: session.user.email ?? "",
      [GRIST_FORMATIONS_COLUMNS.emailOrganisateur]: parsed.emailOrganisateur,
      [GRIST_FORMATIONS_COLUMNS.image]: attachmentIds.length
        ? ["L", ...attachmentIds]
        : null,
    };

    const [formatRowId] = await addGristRecords(
      config.GRIST_FORMATIONS_DOC_ID,
      config.GRIST_FORMATIONS_FORMATS_TABLE_ID,
      [fields],
    );

    // Date déjà fixée : on crée aussi la session. L'animateur·ice est relié·e à
    // la table Membres via la partie locale de son adresse Tchap, qui vaut le
    // ghid ; introuvable, la session reste sans référence, le texte du Format
    // fait foi.
    if (parsed.dateDebut) {
      const animateurRowId = await findMembreRowId(session.user.id);
      const sessionFields: GristRecordFields = {
        [GRIST_SESSIONS_COLUMNS.format]: formatRowId,
        // Les colonnes DateTime attendent des secondes epoch.
        [GRIST_SESSIONS_COLUMNS.debut]: parisDateToEpochSeconds(
          parsed.dateDebut,
        ),
        // `Fin` est une colonne formule dans Grist : elle se déduit du début
        // et de la durée. La durée choisie dans la liste en est la seule
        // source, il n'y a pas de date de fin à saisir.
        [GRIST_SESSIONS_COLUMNS.dureeIndicative]: dureeHeures,
        [GRIST_SESSIONS_COLUMNS.lienVisioAdmin]: parsed.lienVisioAdmin ?? "",
        [GRIST_SESSIONS_COLUMNS.capacite]: parsed.capacite ?? null,
        [GRIST_SESSIONS_COLUMNS.organisateur]: referentRowId,
        [GRIST_SESSIONS_COLUMNS.animateurIce]: animateurRowId
          ? ["L", animateurRowId]
          : null,
      };
      await addGristRecords(
        config.GRIST_FORMATIONS_DOC_ID,
        config.GRIST_FORMATIONS_SESSIONS_TABLE_ID,
        [sessionFields],
      );
    }

    return { ok: true, statut };
  },
);

/**
 * Inscrit le membre connecté à une session de formation.
 *
 * Bascule sur liste d'attente quand la capacité est atteinte, et ne crée
 * jamais de doublon : une deuxième demande renvoie l'état déjà enregistré.
 */
export const registerToFormationSession = withErrorHandling(
  async (sessionId: string) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthorizationError("Tu dois être connecté·e.");
    }

    if (!config.GRIST_API_KEY || !config.GRIST_FORMATIONS_DOC_ID) {
      throw new BusinessError(
        "gristNotConfigured",
        "L'intégration Grist n'est pas configurée.",
      );
    }
    const docId = config.GRIST_FORMATIONS_DOC_ID;

    const sessionRowId = Number(sessionId);
    if (!Number.isInteger(sessionRowId) || sessionRowId <= 0) {
      throw new BusinessError("SessionInconnue", "Cette session n'existe pas.");
    }

    // La ligne Membres est créée au besoin : n'échouer ici que si Grist l'a
    // refusée.
    const membreRowId = await findOrCreateMembreRowId(session.user.id);
    if (!membreRowId) {
      throw new BusinessError(
        "MembreIntrouvable",
        "Ton compte n'a pas pu être ajouté à l'annuaire des formations.",
      );
    }

    // Les inscriptions de la session servent deux fois : détecter un doublon,
    // et compter les places prises.
    const inscriptions = await getGristRecords(
      docId,
      config.GRIST_FORMATIONS_INSCRIPTIONS_TABLE_ID,
      { [GRIST_INSCRIPTIONS_COLUMNS.session]: [sessionRowId] },
    );

    const existing = inscriptions.find(
      (i) =>
        Number(i.fields[GRIST_INSCRIPTIONS_COLUMNS.membre]) === membreRowId,
    );
    if (existing) {
      return {
        ok: true,
        alreadyRegistered: true,
        onWaitingList:
          !!existing.fields[GRIST_INSCRIPTIONS_COLUMNS.surListeDAttente],
      };
    }

    const [sessionRow] = (
      await getGristRecords(docId, config.GRIST_FORMATIONS_SESSIONS_TABLE_ID)
    ).filter((row) => row.id === sessionRowId);
    if (!sessionRow) {
      throw new BusinessError("SessionInconnue", "Cette session n'existe pas.");
    }

    // On n'assiste pas à sa propre formation. Le bouton est déjà masqué, mais
    // l'action doit refuser aussi : cacher un bouton ne protège rien.
    const formatRowId = Number(
      sessionRow.fields[GRIST_SESSIONS_COLUMNS.format],
    );
    const formation = formatRowId
      ? await fetchGristFormationById(String(formatRowId), {
          statuts: [FORMATION_STATUT.VALIDEE, FORMATION_STATUT.PROPOSEE],
        })
      : undefined;
    if (formation && isFormationAnimator(session.user, formation)) {
      throw new BusinessError(
        "AnimateurNeSInscritPas",
        "Tu animes cette formation, tu n'as pas besoin de t'y inscrire.",
      );
    }

    // Capacité atteinte : on inscrit quand même, sur liste d'attente. Une
    // capacité absente vaut « pas de limite ».
    const capacite = Number(
      sessionRow.fields[GRIST_SESSIONS_COLUMNS.capacite] ?? 0,
    );
    const inscrits = inscriptions.filter(
      (i) => !i.fields[GRIST_INSCRIPTIONS_COLUMNS.surListeDAttente],
    ).length;
    const onWaitingList = capacite > 0 && inscrits >= capacite;

    await addGristRecords(
      docId,
      config.GRIST_FORMATIONS_INSCRIPTIONS_TABLE_ID,
      [
        {
          [GRIST_INSCRIPTIONS_COLUMNS.membre]: membreRowId,
          [GRIST_INSCRIPTIONS_COLUMNS.session]: sessionRowId,
          [GRIST_INSCRIPTIONS_COLUMNS.createdAt]: new Date().toISOString(),
          [GRIST_INSCRIPTIONS_COLUMNS.surListeDAttente]: onWaitingList,
          // Figé ici : un repêchage se reconnaît à ce que cette colonne dise
          // « en attente » alors que la précédente n'y est plus.
          [GRIST_INSCRIPTIONS_COLUMNS.enAttenteALInscription]: onWaitingList,
          [GRIST_INSCRIPTIONS_COLUMNS.present]: false,
          [GRIST_INSCRIPTIONS_COLUMNS.email]: session.user.email ?? "",
        },
      ],
    );

    return { ok: true, alreadyRegistered: false, onWaitingList };
  },
);

/**
 * Modifie une formation.
 *
 * Réservé à l'équipe d'animation et à la personne qui l'anime : le droit est
 * recalculé ici à partir de la formation enregistrée, jamais reçu du client.
 * Le statut n'est pas modifiable par ce chemin — une proposition ne se valide
 * pas elle-même.
 */
/**
 * Désinscription d'une session.
 *
 * La ligne d'inscription est supprimée, puis la liste d'attente est recalculée :
 * une place qui se libère doit profiter à la personne qui attend depuis le plus
 * longtemps, sans intervention manuelle.
 */
/**
 * Note les événements d'agenda à retirer.
 *
 * Écrit avant la suppression des lignes qu'ils concernent : une fois celles-ci
 * effacées, plus rien ne dirait quoi enlever de l'agenda. Le workflow n8n lit
 * cette table et fait le ménage.
 *
 * Un échec ici ne doit pas empêcher la suppression demandée : l'utilisateur a
 * cliqué, l'action doit aboutir. On perd le nettoyage de l'agenda, pas plus.
 */
async function noterSuppressionsAgenda(
  docId: string,
  entrees: { uid: string; contexte: string }[],
): Promise<void> {
  if (entrees.length === 0) return;
  try {
    await addGristRecords(
      docId,
      config.GRIST_FORMATIONS_SUPPRESSIONS_AGENDA_TABLE_ID,
      entrees.map(({ uid, contexte }) => ({
        [GRIST_SUPPRESSIONS_AGENDA_COLUMNS.uid]: uid,
        [GRIST_SUPPRESSIONS_AGENDA_COLUMNS.contexte]: contexte,
        [GRIST_SUPPRESSIONS_AGENDA_COLUMNS.creeLe]: new Date().toISOString(),
        [GRIST_SUPPRESSIONS_AGENDA_COLUMNS.supprime]: false,
      })),
    );
  } catch {
    // Tant pis pour l'agenda : la suppression demandée prime.
  }
}

export const unregisterFromFormationSession = withErrorHandling(
  async (sessionId: string) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthorizationError("Tu dois être connecté·e.");
    }

    if (!config.GRIST_API_KEY || !config.GRIST_FORMATIONS_DOC_ID) {
      throw new BusinessError(
        "gristNotConfigured",
        "L'intégration Grist n'est pas configurée.",
      );
    }
    const docId = config.GRIST_FORMATIONS_DOC_ID;

    const sessionRowId = Number(sessionId);
    if (!Number.isInteger(sessionRowId) || sessionRowId <= 0) {
      throw new BusinessError("SessionInconnue", "Cette session n'existe pas.");
    }

    // Lecture seule : se désinscrire ne justifie pas de créer une ligne
    // Membres. Personne dans l'annuaire veut dire personne d'inscrit.
    const membreRowId = await findMembreRowId(session.user.id);
    if (!membreRowId) {
      throw new BusinessError(
        "PasInscrit",
        "Tu n'es pas inscrit·e à cette formation.",
      );
    }

    const inscriptions = await getGristRecords(
      docId,
      config.GRIST_FORMATIONS_INSCRIPTIONS_TABLE_ID,
      { [GRIST_INSCRIPTIONS_COLUMNS.session]: [sessionRowId] },
    );
    // Une même personne ne devrait avoir qu'une ligne, mais les données
    // reprises en contiennent des doublons : on retire tout ce qui la concerne.
    const siennes = inscriptions.filter(
      (i) =>
        Number(i.fields[GRIST_INSCRIPTIONS_COLUMNS.membre]) === membreRowId,
    );
    if (siennes.length === 0) {
      throw new BusinessError(
        "PasInscrit",
        "Tu n'es pas inscrit·e à cette formation.",
      );
    }

    await noterSuppressionsAgenda(
      docId,
      siennes.map((i) => ({
        uid: uidEvenementInscription(sessionRowId, i.id),
        contexte: `Désinscription de ${session.user.id}`,
      })),
    );
    await deleteGristRecords(
      docId,
      config.GRIST_FORMATIONS_INSCRIPTIONS_TABLE_ID,
      siennes.map((i) => i.id),
    );

    const [sessionRow] = (
      await getGristRecords(docId, config.GRIST_FORMATIONS_SESSIONS_TABLE_ID)
    ).filter((row) => row.id === sessionRowId);
    const capacite = Number(
      sessionRow?.fields[GRIST_SESSIONS_COLUMNS.capacite] ?? 0,
    );
    const { promoted } = await syncSessionWaitingList(sessionRowId, capacite);

    const formatRowId = Number(
      sessionRow?.fields[GRIST_SESSIONS_COLUMNS.format] ?? 0,
    );
    if (formatRowId) revalidatePath(`/formations/${formatRowId}`);
    revalidatePath("/formations");

    return { ok: true, promoted };
  },
);

/**
 * Validation d'une proposition : elle entre au catalogue.
 *
 * Réservé à l'équipe d'animation, et non à toute personne qui peut gérer la
 * formation : sans quoi la personne qui propose validerait sa propre
 * proposition, et le tri n'aurait plus de sens.
 */
export const validateFormation = withErrorHandling(
  async (formationId: string) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthorizationError("Tu dois être connecté·e.");
    }

    if (!config.GRIST_API_KEY || !config.GRIST_FORMATIONS_DOC_ID) {
      throw new BusinessError(
        "gristNotConfigured",
        "L'intégration Grist n'est pas configurée.",
      );
    }

    if (!(await isAnimationTeamMember(session.user))) {
      throw new AuthorizationError(
        "Seule l'équipe animation peut valider une formation.",
      );
    }

    const formation = await fetchGristFormationById(formationId, {
      statuts: [FORMATION_STATUT.PROPOSEE],
    });
    if (!formation) {
      throw new BusinessError(
        "FormationInconnue",
        "Cette formation n'existe pas, ou elle est déjà validée.",
      );
    }

    await updateGristRecords(
      config.GRIST_FORMATIONS_DOC_ID,
      config.GRIST_FORMATIONS_FORMATS_TABLE_ID,
      [
        {
          id: Number(formationId),
          fields: {
            [GRIST_FORMATIONS_COLUMNS.statut]: FORMATION_STATUT.VALIDEE,
          },
        },
      ],
    );

    revalidatePath(`/formations/${formationId}`);
    revalidatePath("/formations");
    return { ok: true };
  },
);

/**
 * Programmation de dates pour une formation existante.
 *
 * Couvre les deux besoins d'un seul geste : reprogrammer une formation à une
 * autre date, ou en poser une série. Chaque occurrence devient une session à
 * part entière, avec ses propres inscriptions.
 */
export const scheduleFormationSessions = withErrorHandling(
  async (data: formationScheduleSchemaType) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthorizationError("Tu dois être connecté·e.");
    }

    const parsed = formationScheduleSchema.parse(data);

    if (!config.GRIST_API_KEY || !config.GRIST_FORMATIONS_DOC_ID) {
      throw new BusinessError(
        "gristNotConfigured",
        "L'intégration Grist n'est pas configurée.",
      );
    }

    const formation = await fetchGristFormationById(parsed.formationId, {
      statuts: [FORMATION_STATUT.VALIDEE, FORMATION_STATUT.PROPOSEE],
    });
    if (!formation) {
      throw new BusinessError(
        "FormationInconnue",
        "Cette formation n'existe pas.",
      );
    }
    if (!(await canManageFormation(session.user, formation))) {
      throw new AuthorizationError(
        "Seule l'équipe animation ou la personne qui anime peut programmer des dates.",
      );
    }

    const dureeHeures =
      FORMATION_DUREES.find((d) => d.label === parsed.duree)?.hours ?? null;

    // La série se calcule en heure murale, puis chaque occurrence devient un
    // instant : « tous les mois à 14 h » reste 14 h après le changement
    // d'heure, ce qui ne serait pas le cas en ajoutant des durées à un instant.
    const dates = formationSessionDates(parsed.dateDebut, {
      frequence: parsed.frequence,
      intervalle: parsed.intervalle,
      // Champ vide : la série garde le jour de la date de départ.
      jour: parsed.jour ? Number(parsed.jour) : undefined,
      occurrences: parsed.occurrences,
    });

    const animateurRowId = await findMembreRowId(
      formation.animatorTchap?.split("@")[0] || undefined,
    );
    const organisateurRowId = await findOrCreateMembreRowId(session.user.id);

    await addGristRecords(
      config.GRIST_FORMATIONS_DOC_ID,
      config.GRIST_FORMATIONS_SESSIONS_TABLE_ID,
      dates.map((date) => ({
        [GRIST_SESSIONS_COLUMNS.format]: Number(parsed.formationId),
        // Les colonnes DateTime attendent des secondes epoch.
        [GRIST_SESSIONS_COLUMNS.debut]: parisDateToEpochSeconds(date),
        // `Fin` est une colonne formule : elle se déduit du début et de la
        // durée.
        [GRIST_SESSIONS_COLUMNS.dureeIndicative]: dureeHeures,
        [GRIST_SESSIONS_COLUMNS.lienVisioAdmin]: parsed.lienVisioAdmin ?? "",
        [GRIST_SESSIONS_COLUMNS.capacite]: parsed.capacite ?? null,
        [GRIST_SESSIONS_COLUMNS.organisateur]: organisateurRowId,
        [GRIST_SESSIONS_COLUMNS.animateurIce]: animateurRowId
          ? ["L", animateurRowId]
          : null,
      })),
    );

    revalidatePath(`/formations/${parsed.formationId}`);
    revalidatePath("/formations");
    return { ok: true, created: dates.length };
  },
);

/**
 * Modification d'une date précise.
 *
 * L'horaire, la durée, la capacité et le lien de visioconférence appartiennent
 * à une date : les changer ne touche pas aux autres. Le droit se vérifie sur la
 * formation parente, seule porteuse de l'animateur·ice.
 */
export const updateFormationSession = withErrorHandling(
  async (data: formationSessionUpdateSchemaType) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthorizationError("Tu dois être connecté·e.");
    }

    const parsed = formationSessionUpdateSchema.parse(data);

    if (!config.GRIST_API_KEY || !config.GRIST_FORMATIONS_DOC_ID) {
      throw new BusinessError(
        "gristNotConfigured",
        "L'intégration Grist n'est pas configurée.",
      );
    }
    const docId = config.GRIST_FORMATIONS_DOC_ID;

    const sessionRowId = Number(parsed.sessionId);
    const [sessionRow] = (
      await getGristRecords(docId, config.GRIST_FORMATIONS_SESSIONS_TABLE_ID)
    ).filter((row) => row.id === sessionRowId);
    if (!sessionRow) {
      throw new BusinessError("SessionInconnue", "Cette date n'existe pas.");
    }

    const formatRowId = Number(
      sessionRow.fields[GRIST_SESSIONS_COLUMNS.format] ?? 0,
    );
    const formation = formatRowId
      ? await fetchGristFormationById(String(formatRowId), {
          statuts: [FORMATION_STATUT.VALIDEE, FORMATION_STATUT.PROPOSEE],
        })
      : undefined;
    if (!formation) {
      throw new BusinessError(
        "FormationInconnue",
        "Cette formation n'existe pas.",
      );
    }
    if (!(await canManageFormation(session.user, formation))) {
      throw new AuthorizationError(
        "Seule l'équipe animation ou la personne qui anime peut modifier cette date.",
      );
    }

    const dureeHeures =
      FORMATION_DUREES.find((d) => d.label === parsed.duree)?.hours ?? null;

    await updateGristRecords(docId, config.GRIST_FORMATIONS_SESSIONS_TABLE_ID, [
      {
        id: sessionRowId,
        fields: {
          [GRIST_SESSIONS_COLUMNS.debut]: parisDateToEpochSeconds(
            parsed.dateDebut,
          ),
          [GRIST_SESSIONS_COLUMNS.dureeIndicative]: dureeHeures,
          // `?? null` et pas `undefined` : JSON.stringify retire les clés
          // indéfinies, Grist garderait l'ancienne limite alors que la ligne
          // suivante reclasse la liste d'attente comme s'il n'y en avait plus.
          [GRIST_SESSIONS_COLUMNS.capacite]: parsed.capacite ?? null,
          [GRIST_SESSIONS_COLUMNS.lienVisioAdmin]: parsed.lienVisioAdmin ?? "",
        },
      },
    ]);

    // La capacité vient de changer : les inscriptions déjà prises doivent être
    // reclassées, sans quoi la liste d'attente resterait figée.
    await syncSessionWaitingList(sessionRowId, parsed.capacite ?? null);

    revalidatePath(`/formations/${formatRowId}`);
    revalidatePath("/formations");
    return { ok: true };
  },
);

/**
 * Suppression d'une date.
 *
 * Les inscriptions de la date partent avec elle : les laisser ferait des lignes
 * orphelines, rattachées à une session qui n'existe plus, qui gonfleraient les
 * compteurs sans correspondre à rien.
 *
 * Rien n'est prévenu automatiquement : c'est à la personne qui annule de
 * prévenir les inscrits, d'où le décompte renvoyé.
 *
 * @returns le nombre d'inscriptions supprimées avec la date.
 */
export const deleteFormationSession = withErrorHandling(
  async (sessionId: string) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthorizationError("Tu dois être connecté·e.");
    }

    if (!config.GRIST_API_KEY || !config.GRIST_FORMATIONS_DOC_ID) {
      throw new BusinessError(
        "gristNotConfigured",
        "L'intégration Grist n'est pas configurée.",
      );
    }
    const docId = config.GRIST_FORMATIONS_DOC_ID;

    const sessionRowId = Number(sessionId);
    if (!Number.isInteger(sessionRowId) || sessionRowId <= 0) {
      throw new BusinessError("SessionInconnue", "Cette date n'existe pas.");
    }

    const [sessionRow] = (
      await getGristRecords(docId, config.GRIST_FORMATIONS_SESSIONS_TABLE_ID)
    ).filter((row) => row.id === sessionRowId);
    if (!sessionRow) {
      throw new BusinessError("SessionInconnue", "Cette date n'existe pas.");
    }

    const formatRowId = Number(
      sessionRow.fields[GRIST_SESSIONS_COLUMNS.format] ?? 0,
    );
    const formation = formatRowId
      ? await fetchGristFormationById(String(formatRowId), {
          statuts: [FORMATION_STATUT.VALIDEE, FORMATION_STATUT.PROPOSEE],
        })
      : undefined;
    if (!formation) {
      throw new BusinessError(
        "FormationInconnue",
        "Cette formation n'existe pas.",
      );
    }
    if (!(await canManageFormation(session.user, formation))) {
      throw new AuthorizationError(
        "Seule l'équipe animation ou la personne qui anime peut supprimer cette date.",
      );
    }

    const inscriptions = await getGristRecords(
      docId,
      config.GRIST_FORMATIONS_INSCRIPTIONS_TABLE_ID,
      { [GRIST_INSCRIPTIONS_COLUMNS.session]: [sessionRowId] },
    );
    // Trace de l'annulation avant de supprimer quoi que ce soit : les
    // inscriptions partent avec la date, et avec elles les adresses à qui
    // écrire. C'est cette ligne qui permet de prévenir les inscrit·es.
    const destinataires = inscriptions
      .map((i) => String(i.fields[GRIST_INSCRIPTIONS_COLUMNS.email] ?? ""))
      .filter((email) => !!email);
    if (destinataires.length > 0) {
      await addGristRecords(
        docId,
        config.GRIST_FORMATIONS_ANNULATIONS_TABLE_ID,
        [
          {
            [GRIST_ANNULATIONS_COLUMNS.titre]: formation.name,
            [GRIST_ANNULATIONS_COLUMNS.debut]:
              sessionRow.fields[GRIST_SESSIONS_COLUMNS.debut] ?? null,
            [GRIST_ANNULATIONS_COLUMNS.emails]: destinataires.join(", "),
            [GRIST_ANNULATIONS_COLUMNS.annuleeLe]: new Date().toISOString(),
            [GRIST_ANNULATIONS_COLUMNS.annuleePar]: session.user.id,
            [GRIST_ANNULATIONS_COLUMNS.mailEnvoye]: false,
          },
        ],
      );
    }

    // Les événements de la date partent aussi : celui de chaque personne
    // inscrite, et celui de l'animateur·ice.
    await noterSuppressionsAgenda(docId, [
      ...inscriptions.map((i) => ({
        uid: uidEvenementInscription(sessionRowId, i.id),
        contexte: `Date supprimée : ${formation.name}`,
      })),
      {
        uid: uidEvenementAnimation(sessionRowId),
        contexte: `Date supprimée : ${formation.name} (animation)`,
      },
    ]);

    // Les inscriptions d'abord : si la suppression de la session échouait
    // ensuite, mieux vaut une date vide qu'une date fantôme avec des inscrits.
    await deleteGristRecords(
      docId,
      config.GRIST_FORMATIONS_INSCRIPTIONS_TABLE_ID,
      inscriptions.map((i) => i.id),
    );
    await deleteGristRecords(docId, config.GRIST_FORMATIONS_SESSIONS_TABLE_ID, [
      sessionRowId,
    ]);

    revalidatePath(`/formations/${formatRowId}`);
    revalidatePath("/formations");
    return { ok: true, deleted: inscriptions.length };
  },
);

export const updateFormation = withErrorHandling(
  async (data: formationUpdateSchemaType) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthorizationError("Tu dois être connecté·e.");
    }

    const parsed = formationUpdateSchema.parse(data);

    if (!config.GRIST_API_KEY || !config.GRIST_FORMATIONS_DOC_ID) {
      throw new BusinessError(
        "gristNotConfigured",
        "L'intégration Grist n'est pas configurée.",
      );
    }

    const formation = await fetchGristFormationById(parsed.formationId, {
      statuts: [FORMATION_STATUT.VALIDEE, FORMATION_STATUT.PROPOSEE],
    });
    if (!formation) {
      throw new BusinessError(
        "FormationInconnue",
        "Cette formation n'existe pas.",
      );
    }
    if (!(await canManageFormation(session.user, formation))) {
      throw new AuthorizationError(
        "Seule l'équipe animation ou la personne qui anime peut modifier cette formation.",
      );
    }

    const dureeHeures =
      FORMATION_DUREES.find((d) => d.label === parsed.duree)?.hours ?? null;

    await updateGristRecords(
      config.GRIST_FORMATIONS_DOC_ID,
      config.GRIST_FORMATIONS_FORMATS_TABLE_ID,
      [
        {
          id: Number(parsed.formationId),
          fields: {
            [GRIST_FORMATIONS_COLUMNS.titre]: parsed.titre,
            [GRIST_FORMATIONS_COLUMNS.description]: parsed.description,
            [GRIST_FORMATIONS_COLUMNS.modalite]: parsed.modalite,
            [GRIST_FORMATIONS_COLUMNS.thematiques]: [
              "L",
              ...parsed.thematiques,
            ],
            [GRIST_FORMATIONS_COLUMNS.audience]: ["L", ...parsed.audience],
            [GRIST_FORMATIONS_COLUMNS.capacite]: parsed.capacite ?? null,
            [GRIST_FORMATIONS_COLUMNS.duree]: dureeHeures,
            [GRIST_FORMATIONS_COLUMNS.lienAdmin]: parsed.lienVisioAdmin ?? "",
            [GRIST_FORMATIONS_COLUMNS.lienSupport]: parsed.lienSupport ?? "",
            [GRIST_FORMATIONS_COLUMNS.lienFeedback]: parsed.lienFeedback ?? "",
            [GRIST_FORMATIONS_COLUMNS.animateur]: parsed.animateur,
            [GRIST_FORMATIONS_COLUMNS.emailOrganisateur]:
              parsed.emailOrganisateur,
          },
        },
      ],
    );

    // La capacité et le lien saisis ici servent de modèle aux dates à venir.
    // Les dates déjà programmées gardent les leurs : chacune se modifie à part,
    // sinon toucher au modèle bousculerait des inscriptions en cours.

    revalidatePath(`/formations/${parsed.formationId}`);
    revalidatePath("/formations");
    return { ok: true };
  },
);
