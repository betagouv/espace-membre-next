"use server";

import { getServerSession } from "next-auth";
import slugify from "@sindresorhus/slugify";

import { addGristRecords, GristRecordFields } from "@/lib/grist";
import { db } from "@/lib/kysely";
import {
  getMatrixIdByUserId,
  getUserBasicInfo,
  getUserStartupsActive,
} from "@/lib/kysely/queries/users";
import {
  opsRequestSchema,
  opsRequestSchemaType,
} from "@/models/actions/opsRequest";
import {
  GRIST_OPS_COLUMNS,
  OPS_DEMANDE_FIELDS,
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

const MAX_SENTRY_TEAM_SLUG_CHARACTERS = 50;

function generateSentryTeamSlug(name: string) {
  return slugify(name).slice(0, MAX_SENTRY_TEAM_SLUG_CHARACTERS);
}

// Le produit est relu en base à partir de son uuid : le nom envoyé par le
// navigateur ne servait qu'à l'affichage et pouvait ne pas correspondre au
// produit réellement choisi. Un membre non admin ne peut viser qu'un de ses
// produits actifs — la liste déroulante était déjà filtrée, mais rien ne
// l'imposait côté serveur.
async function getProduitDemande({
  startupId,
  userUuid,
  isAdmin,
}: {
  startupId: string;
  userUuid: string;
  isAdmin: boolean;
}) {
  if (!isAdmin) {
    const produitsDuMembre = await getUserStartupsActive(userUuid);
    if (!produitsDuMembre.some((startup) => startup.uuid === startupId)) {
      throw new AuthorizationError(
        "Tu ne peux faire une demande que pour un produit dont tu fais partie.",
      );
    }
  }
  const produit = await db
    .selectFrom("startups")
    .leftJoin("incubators", "incubators.uuid", "startups.incubator_id")
    .select(["startups.name", "incubators.title as incubateur"])
    .where("startups.uuid", "=", startupId)
    .executeTakeFirst();
  if (!produit) {
    throw new BusinessError(
      "opsStartupNotFound",
      "Le produit sélectionné est introuvable.",
    );
  }
  return produit;
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

    // L'auteur de la demande vient de la session, pas du formulaire : passés en
    // champs cachés, son email et son identifiant Tchap se modifiaient depuis
    // le navigateur, et la demande partait au nom de quelqu'un d'autre.
    const user = await getUserBasicInfo({ uuid: session.user.uuid });
    const email = user?.primary_email || user?.secondary_email;
    if (!user || !email) {
      throw new BusinessError(
        "opsUserEmailMissing",
        "Aucun email n'est associé à ton compte : l'équipe ops ne pourrait pas te répondre.",
      );
    }
    const tchapId =
      (await getMatrixIdByUserId(session.user.uuid)) || user.username;

    // Seuls les champs de la ressource choisie partent dans Grist. Le
    // formulaire garde en mémoire ce qui a été saisi pour une autre ressource
    // (et les emails pré-remplis valent pour toutes) : sans ce filtre, une
    // demande Brevo arrivait avec le nom d'app d'une demande Scalingo
    // abandonnée en route.
    const champsDemande: OpsFieldKey[] = OPS_DEMANDE_FIELDS[parsed.demande];
    const valeurs: Partial<Record<OpsFieldKey, string>> = {};
    for (const key of champsDemande) {
      valeurs[key] = parsed[key] ?? "";
    }

    const produit = valeurs.startupId
      ? await getProduitDemande({
          startupId: valeurs.startupId,
          userUuid: session.user.uuid,
          isAdmin: session.user.isAdmin,
        })
      : undefined;

    const teamSlug =
      parsed.demande === OPS_DEMANDE_TYPE.SENTRY && produit
        ? generateSentryTeamSlug(produit.name)
        : "";

    const fields: GristRecordFields = {
      // Grist Date columns expect seconds since epoch.
      [GRIST_OPS_COLUMNS.date]: Math.floor(Date.now() / 1000),
      [GRIST_OPS_COLUMNS.tchapId]: tchapId,
      [GRIST_OPS_COLUMNS.email]: email,
      [GRIST_OPS_COLUMNS.demande]: parsed.demande,
      [GRIST_OPS_COLUMNS.projet]: parsed.projet ?? "",
      [GRIST_OPS_COLUMNS.prenomNom]: user.fullname ?? "",
      // Toujours « À traiter » à la création : c'est l'équipe ops qui le fait
      // avancer, par ses réactions sur Tchap.
      [GRIST_OPS_COLUMNS.statut]: OPS_STATUT.A_TRAITER,
      // Meta / n8n automation fields.
      [GRIST_OPS_COLUMNS.userUuid]: session.user.uuid ?? "",
      [GRIST_OPS_COLUMNS.username]: session.user.id ?? "",
      [GRIST_OPS_COLUMNS.startupName]: produit?.name ?? "",
      // Incubateur du produit sélectionné (ex: la Ruche). Peut être absent si
      // le produit n'est rattaché à aucun incubateur.
      [GRIST_OPS_COLUMNS.incubateur]: produit?.incubateur ?? "",
      [GRIST_OPS_COLUMNS.teamSlug]: teamSlug,
      // Matomo ne gère que des sites "website" pour l'instant.
      [GRIST_OPS_COLUMNS.siteType]:
        parsed.demande === OPS_DEMANDE_TYPE.MATOMO ? "website" : "",
    };

    // One cell per form field (no free-form grouping in "Demande_libre"). Every
    // column is written, empty when the field does not belong to the demande.
    for (const key of Object.keys(OPS_FIELD_TO_GRIST_COLUMN) as OpsFieldKey[]) {
      fields[OPS_FIELD_TO_GRIST_COLUMN[key]] = valeurs[key] ?? "";
    }

    await addGristRecords(config.GRIST_OPS_DOC_ID, config.GRIST_OPS_TABLE_ID, [
      fields,
    ]);

    return { ok: true };
  },
);
