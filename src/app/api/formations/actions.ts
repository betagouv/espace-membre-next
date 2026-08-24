"use server";

import { fromZonedTime } from "date-fns-tz";
import { getServerSession } from "next-auth";

import {
  addGristRecords,
  getGristRecords,
  GristRecordFields,
  uploadGristAttachments,
} from "@/lib/grist";
import { isAnimationTeamMember } from "@/lib/isAnimationTeamMember";
import {
  formationProposalSchema,
  formationProposalSchemaType,
} from "@/models/actions/formationProposal";
import {
  FORMATION_DUREES,
  FORMATION_STATUT,
  GRIST_FORMATIONS_COLUMNS,
  GRIST_INSCRIPTIONS_COLUMNS,
  GRIST_SESSIONS_COLUMNS,
} from "@/models/formationsGrist";
import config from "@/server/config";
import { authOptions } from "@/lib/authoptions";
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
// ou 0 (référence vide côté Grist) si la personne n'y est pas.
async function findMembreRowId(ghid: string | undefined): Promise<number> {
  if (!ghid || !config.GRIST_FORMATIONS_DOC_ID) return 0;
  const membres = await getGristRecords(
    config.GRIST_FORMATIONS_DOC_ID,
    config.GRIST_FORMATIONS_MEMBRES_TABLE_ID,
    { ghid: [ghid] },
  );
  return membres[0]?.id ?? 0;
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

    const referentRowId = await findMembreRowId(session.user.id);

    // L'illustration passe par le magasin de pièces jointes du document : la
    // colonne Image ne stocke que des identifiants.
    const image = parsed.image;
    const attachmentIds =
      image instanceof File && image.size > 0
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
      [GRIST_FORMATIONS_COLUMNS.gestionInscriptions]:
        parsed.gestionInscriptions ?? false,
      [GRIST_FORMATIONS_COLUMNS.animateur]: parsed.animateur,
      [GRIST_FORMATIONS_COLUMNS.animateurTchap]: parsed.animateurTchap ?? "",
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
      const animateurRowId = await findMembreRowId(
        parsed.animateurTchap?.split("@")[0] || undefined,
      );
      const sessionFields: GristRecordFields = {
        [GRIST_SESSIONS_COLUMNS.format]: formatRowId,
        // Les colonnes DateTime attendent des secondes epoch.
        [GRIST_SESSIONS_COLUMNS.debut]: parisDateToEpochSeconds(
          parsed.dateDebut,
        ),
        // La fin est déduite par Grist : on lui donne la durée en heures, prise
        // de l'écart entre les deux dates si elles sont fournies, sinon de la
        // durée choisie dans la liste.
        [GRIST_SESSIONS_COLUMNS.dureeIndicative]: parsed.dateFin
          ? (parisDateToEpochSeconds(parsed.dateFin) -
              parisDateToEpochSeconds(parsed.dateDebut)) /
            3600
          : dureeHeures,
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

    const membreRowId = await findMembreRowId(session.user.id);
    if (!membreRowId) {
      throw new BusinessError(
        "MembreIntrouvable",
        "Ton compte n'a pas été trouvé dans l'annuaire des formations.",
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
          [GRIST_INSCRIPTIONS_COLUMNS.present]: false,
          [GRIST_INSCRIPTIONS_COLUMNS.email]: session.user.email ?? "",
        },
      ],
    );

    return { ok: true, alreadyRegistered: false, onWaitingList };
  },
);
