"use server";

import { getServerSession } from "next-auth";

import { addGristRecords, GristRecordFields } from "@/lib/grist";
import {
  segurRequestSchema,
  segurRequestSchemaType,
} from "@/models/actions/segurRequest";
import {
  GRIST_SEGUR_COLUMNS,
  SEGUR_DEMANDE_TYPE,
  SEGUR_STATUT,
} from "@/models/segur";
import config from "@/server/config";
import { authOptions } from "@/lib/authoptions";
import {
  AuthorizationError,
  BusinessError,
  withErrorHandling,
} from "@/lib/error";

export const submitSegurRequest = withErrorHandling(
  async (data: segurRequestSchemaType) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthorizationError("Tu dois être connecté·e.");
    }

    const parsed = segurRequestSchema.parse(data);

    if (!config.GRIST_API_KEY || !config.GRIST_SEGUR_DOC_ID) {
      throw new BusinessError(
        "gristNotConfigured",
        "L'intégration Grist n'est pas configurée (GRIST_API_KEY / GRIST_SEGUR_DOC_ID).",
      );
    }

    // "Prénom Nom <email>" par membre, séparés par des retours ligne. Les
    // lignes vides (au moins un des deux champs manquant) sont ignorées.
    const membresRemplis = (parsed.autresMembres ?? []).filter(
      (m) => m.prenomNom?.trim() || m.email?.trim(),
    );
    const autresMembres = membresRemplis
      .map((m) =>
        [m.prenomNom?.trim(), m.email?.trim()].filter(Boolean).join(" — "),
      )
      .join("\n");
    // Le demandeur compte dans le nombre de personnes. Le nombre saisi fait foi
    // quand il est fourni : on peut venir à plusieurs sans nommer tout le monde.
    // Le schéma garantit qu'il n'est jamais inférieur au nombre de personnes
    // nommées.
    const nbPersonnes = parsed.nbParticipants ?? 1 + membresRemplis.length;

    const isSalleReunion =
      parsed.typeDemande === SEGUR_DEMANDE_TYPE.SALLE_REUNION;

    // Une ligne par date demandée, le créneau horaire étant commun.
    const datesReunion = (parsed.datesReunion ?? [])
      .map((d) => d.date?.trim())
      .filter(Boolean)
      .join(", ");

    // Champs communs aux deux types de demande.
    const commonFields: GristRecordFields = {
      // Grist DateTime columns expect seconds since epoch.
      [GRIST_SEGUR_COLUMNS.date]: Math.floor(Date.now() / 1000),
      [GRIST_SEGUR_COLUMNS.prenomNom]: parsed.prenomNom,
      [GRIST_SEGUR_COLUMNS.email]: parsed.email,
      [GRIST_SEGUR_COLUMNS.startupName]: parsed.startupName,
      [GRIST_SEGUR_COLUMNS.emailsEquipe]: autresMembres,
      [GRIST_SEGUR_COLUMNS.nbPersonnes]: nbPersonnes,
      [GRIST_SEGUR_COLUMNS.precisions]: parsed.precisions ?? "",
      [GRIST_SEGUR_COLUMNS.statut]: parsed.statut ?? SEGUR_STATUT.A_TRAITER,
      // false at creation; the n8n workflow flips it to true after sending the
      // confirmation email, so a request is never notified twice.
      [GRIST_SEGUR_COLUMNS.mailEnvoye]: false,
      [GRIST_SEGUR_COLUMNS.userUuid]: session.user.uuid ?? "",
      [GRIST_SEGUR_COLUMNS.username]: session.user.id ?? "",
    };

    // Une table par type : la table porte l'information du type, et aucune
    // colonne de l'autre type n'est écrite à vide.
    const tableId = isSalleReunion
      ? config.GRIST_SEGUR_REUNION_TABLE_ID
      : config.GRIST_SEGUR_TABLE_ID;

    const fields: GristRecordFields = isSalleReunion
      ? {
          ...commonFields,
          [GRIST_SEGUR_COLUMNS.datesReunion]: datesReunion,
          [GRIST_SEGUR_COLUMNS.heureDebut]: parsed.heureDebut ?? "",
          [GRIST_SEGUR_COLUMNS.heureFin]: parsed.heureFin ?? "",
          [GRIST_SEGUR_COLUMNS.materiel]: parsed.materiel ?? "",
        }
      : {
          ...commonFields,
          [GRIST_SEGUR_COLUMNS.dateDebut]: parsed.dateDebut ?? "",
          [GRIST_SEGUR_COLUMNS.dateFin]: parsed.dateFin ?? "",
          [GRIST_SEGUR_COLUMNS.joursRecurrents]: (
            parsed.joursRecurrents ?? []
          ).join(", "),
          [GRIST_SEGUR_COLUMNS.periodeRecurrente]:
            parsed.periodeRecurrente ?? "",
          [GRIST_SEGUR_COLUMNS.engagement]: parsed.engagement ?? false,
        };

    await addGristRecords(config.GRIST_SEGUR_DOC_ID, tableId, [fields]);

    return { ok: true };
  },
);
