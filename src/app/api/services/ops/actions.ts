"use server";

import { getServerSession } from "next-auth";

import { addGristRecords, GristRecordFields } from "@/lib/grist";
import { generateSentryTeamSlug } from "@/lib/sentry";
import {
  opsRequestSchema,
  opsRequestSchemaType,
} from "@/models/actions/opsRequest";
import {
  GRIST_OPS_COLUMNS,
  OPS_DEMANDE_FIELDS,
  OPS_DEMANDE_TYPE,
  OPS_FIELDS,
  OPS_STATUT,
  OPS_STRUCTURED_FIELD_KEYS,
} from "@/models/ops";
import config from "@/server/config";
import { authOptions } from "@/utils/authoptions";
import {
  AuthorizationError,
  BusinessError,
  withErrorHandling,
} from "@/utils/error";

// Build a readable summary of the demande-specific fields (everything except
// the free-form "commentaires", which goes to its own Notes column).
function buildDemandeLibre(data: opsRequestSchemaType): string {
  const keys = OPS_DEMANDE_FIELDS[data.demande] ?? [];
  return keys
    .filter(
      (key) =>
        key !== "commentaires" && !OPS_STRUCTURED_FIELD_KEYS.includes(key),
    )
    .map((key) => ({ label: OPS_FIELDS[key].label, value: data[key] }))
    .filter((line) => line.value)
    .map((line) => `${line.label}: ${line.value}`)
    .join("\n");
}

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

    const fields: GristRecordFields = {
      // Grist Date columns expect seconds since epoch.
      [GRIST_OPS_COLUMNS.date]: Math.floor(Date.now() / 1000),
      [GRIST_OPS_COLUMNS.tchapId]: parsed.tchapId,
      [GRIST_OPS_COLUMNS.email]: parsed.email,
      [GRIST_OPS_COLUMNS.demande]: parsed.demande,
      [GRIST_OPS_COLUMNS.projet]: parsed.projet ?? "",
      [GRIST_OPS_COLUMNS.demandeLibre]: buildDemandeLibre(parsed),
      [GRIST_OPS_COLUMNS.notes]: parsed.commentaires ?? "",
      [GRIST_OPS_COLUMNS.prenomNom]: parsed.prenomNom ?? "",
      [GRIST_OPS_COLUMNS.statut]: parsed.statut ?? OPS_STATUT.A_TRAITER,
      // Structured fields consumed by the n8n Sentry / Matomo automations.
      [GRIST_OPS_COLUMNS.userUuid]: session.user.uuid ?? "",
      [GRIST_OPS_COLUMNS.username]: session.user.id ?? "",
      [GRIST_OPS_COLUMNS.startupId]: parsed.startupId ?? "",
      [GRIST_OPS_COLUMNS.startupName]: parsed.startupName ?? "",
      [GRIST_OPS_COLUMNS.teamSlug]: teamSlug,
      [GRIST_OPS_COLUMNS.siteUrl]: parsed.urlSite ?? "",
      // Matomo ne gère que des sites "website" pour l'instant.
      [GRIST_OPS_COLUMNS.siteType]:
        parsed.demande === OPS_DEMANDE_TYPE.MATOMO ? "website" : "",
      [GRIST_OPS_COLUMNS.siteName]: parsed.siteName ?? "",
      [GRIST_OPS_COLUMNS.projetRattachement]: parsed.projetRattachement ?? "",
    };

    await addGristRecords(config.GRIST_OPS_DOC_ID, config.GRIST_OPS_TABLE_ID, [
      fields,
    ]);

    return { ok: true };
  },
);
