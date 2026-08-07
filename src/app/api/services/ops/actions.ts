"use server";

import { getServerSession } from "next-auth";

import { addGristRecords, GristRecordFields } from "@/lib/grist";
import { db } from "@/lib/kysely";
import { generateSentryTeamSlug } from "@/lib/sentry";
import {
  opsRequestSchema,
  opsRequestSchemaType,
} from "@/models/actions/opsRequest";
import {
  GRIST_OPS_COLUMNS,
  OPS_DEMANDE_TYPE,
  OPS_FIELD_TO_GRIST_COLUMN,
  OPS_STATUT,
  OpsFieldKey,
} from "@/models/ops";
import config from "@/server/config";
import { authOptions } from "@/lib/authoptions";
import {
  AuthorizationError,
  BusinessError,
  withErrorHandling,
} from "@/lib/error";

export const submitOpsRequest = withErrorHandling(
  async (data: opsRequestSchemaType) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthorizationError("Tu dois être connecté·e.");
    }

    const parsed = opsRequestSchema.parse(data);

    if (!config.GRIST_API_KEY || !config.GRIST_OPS_DOC_ID) {
      throw new BusinessError(
        "gristNotConfigured",
        "L'intégration Grist n'est pas configurée (GRIST_API_KEY / GRIST_OPS_DOC_ID).",
      );
    }

    // Sentry team slug is derived from the startup name (same rule as the
    // legacy pg-boss worker) so n8n doesn't have to recompute it.
    const teamSlug =
      parsed.demande === OPS_DEMANDE_TYPE.SENTRY && parsed.startupName
        ? generateSentryTeamSlug(parsed.startupName)
        : "";

    // Incubateur du produit sélectionné (ex: la Ruche). Peut être absent si le
    // produit n'est rattaché à aucun incubateur.
    const incubateur = parsed.startupId
      ? ((
          await db
            .selectFrom("startups")
            .innerJoin("incubators", "incubators.uuid", "startups.incubator_id")
            .select("incubators.title")
            .where("startups.uuid", "=", parsed.startupId)
            .executeTakeFirst()
        )?.title ?? "")
      : "";

    const fields: GristRecordFields = {
      // Grist Date columns expect seconds since epoch.
      [GRIST_OPS_COLUMNS.date]: Math.floor(Date.now() / 1000),
      [GRIST_OPS_COLUMNS.tchapId]: parsed.tchapId,
      [GRIST_OPS_COLUMNS.email]: parsed.email,
      [GRIST_OPS_COLUMNS.demande]: parsed.demande,
      [GRIST_OPS_COLUMNS.projet]: parsed.projet ?? "",
      [GRIST_OPS_COLUMNS.prenomNom]: parsed.prenomNom ?? "",
      [GRIST_OPS_COLUMNS.statut]: parsed.statut ?? OPS_STATUT.A_TRAITER,
      // Meta / n8n automation fields.
      [GRIST_OPS_COLUMNS.userUuid]: session.user.uuid ?? "",
      [GRIST_OPS_COLUMNS.username]: session.user.id ?? "",
      [GRIST_OPS_COLUMNS.startupName]: parsed.startupName ?? "",
      [GRIST_OPS_COLUMNS.incubateur]: incubateur,
      [GRIST_OPS_COLUMNS.teamSlug]: teamSlug,
      // Matomo ne gère que des sites "website" pour l'instant.
      [GRIST_OPS_COLUMNS.siteType]:
        parsed.demande === OPS_DEMANDE_TYPE.MATOMO ? "website" : "",
    };

    // One cell per form field (no free-form grouping in "Demande_libre").
    for (const key of Object.keys(OPS_FIELD_TO_GRIST_COLUMN) as OpsFieldKey[]) {
      fields[OPS_FIELD_TO_GRIST_COLUMN[key]] = parsed[key] ?? "";
    }

    await addGristRecords(config.GRIST_OPS_DOC_ID, config.GRIST_OPS_TABLE_ID, [
      fields,
    ]);

    return { ok: true };
  },
);
