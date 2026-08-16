import { revalidatePath } from "next/cache";

import { toResourceRef } from "@/lib/api/identifier";
import { canAccessIncubator, canWriteIncubator } from "@/lib/api/perimeter";
import {
  invalidRequest,
  methodNotAllowed,
  problem,
} from "@/lib/api/problem";
import { withApiV1 } from "@/lib/api/withApiV1";
import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import {
  getIncubatorByRef,
  updateIncubatorDescriptive,
} from "@/lib/kysely/queries/incubators";
import { EventCode, SYSTEM_NAME } from "@/models/actionEvent/actionEvent";
import { jsonItem, noContent } from "@/models/api/envelope";
import {
  incubatorApiResponseSchema,
  incubatorPatchSchema,
} from "@/models/api/incubator";

export const dynamic = "force-dynamic";

/** highlighted_startups est expose en ghid et stocke en uuid. */
async function resolveHighlightedGhids(uuid: string) {
  const rows = await db
    .selectFrom("startups")
    .select("startups.ghid")
    .where("startups.uuid", "=", uuid)
    .execute();
  return rows;
}

async function toRepresentation(row: {
  uuid: string;
  title: string;
  ghid: string;
  short_description: string | null;
  description: string | null;
  contact: string | null;
  address: string | null;
  website: string | null;
  github: string | null;
  highlighted_startups?: string[] | null;
}) {
  // Reference orpheline filtree : le tableau ne porte que des ghid resolvables.
  const ghids: string[] = [];
  for (const startupUuid of row.highlighted_startups ?? []) {
    const [found] = await resolveHighlightedGhids(startupUuid);
    if (found?.ghid) ghids.push(found.ghid);
  }
  return { ...row, highlighted_startups: ghids.sort() };
}

export const GET = withApiV1<{ id: string }>(
  { scope: "incubators:read" },
  async (req, { params, key }) => {
    const incubator = await getIncubatorByRef(toResourceRef(params.id));
    // Le 404 passe AVANT le 403 de perimetre : il faut resoudre la ressource
    // pour savoir si elle existe.
    if (!incubator) {
      return problem("not_found", { instance: req.nextUrl.pathname });
    }
    if (!(await canAccessIncubator(key.read, incubator.uuid))) {
      return problem("out_of_perimeter", { instance: req.nextUrl.pathname });
    }
    return jsonItem(
      incubatorApiResponseSchema,
      await toRepresentation(incubator),
    );
  },
);

export const PATCH = withApiV1<{ id: string }>(
  { scope: "incubators:write", mediaTypes: ["application/merge-patch+json"] },
  async (req, { params, key }) => {
    const incubator = await getIncubatorByRef(toResourceRef(params.id));
    if (!incubator) {
      return problem("not_found", { instance: req.nextUrl.pathname });
    }
    if (!key.write || !canWriteIncubator(key.write, incubator.uuid)) {
      return problem("out_of_perimeter", { instance: req.nextUrl.pathname });
    }

    const parsed = incubatorPatchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return invalidRequest(parsed.error, { instance: req.nextUrl.pathname });
    }

    // Un merge-patch vide est valide (RFC 7396) et ne change rien. Sans ce
    // court-circuit, kysely emet `update incubators set  where ...`, du SQL
    // invalide, et la reponse serait 500.
    if (!Object.keys(parsed.data).length) {
      if (!key.has("incubators:read")) return noContent();
      return jsonItem(
        incubatorApiResponseSchema,
        await toRepresentation(incubator),
      );
    }

    const { highlighted_startups, ...descriptive } = parsed.data;
    const values: Record<string, unknown> = { ...descriptive };

    if (highlighted_startups) {
      // Conversion ghid vers uuid a l'ecriture ; un ghid inconnu produit un 422
      // avec le pointeur du champ fautif.
      const uuids: string[] = [];
      for (const [index, ghid] of highlighted_startups.entries()) {
        const found = await db
          .selectFrom("startups")
          .select("startups.uuid")
          .where("startups.ghid", "=", ghid)
          .executeTakeFirst();
        if (!found) {
          return problem("invalid_request", {
            instance: req.nextUrl.pathname,
            detail: `Produit inconnu : ${ghid}.`,
            extensions: {
              errors: [
                {
                  pointer: `/highlighted_startups/${index}`,
                  code: "unknown_ghid",
                  detail: `Aucun produit ne porte le ghid ${ghid}.`,
                },
              ],
            },
          });
        }
        uuids.push(found.uuid);
      }
      values.highlighted_startups = uuids;
    }

    const updated = await updateIncubatorDescriptive(incubator.uuid, values);

    await addEvent({
      action_code: EventCode.INCUBATOR_API_UPDATED,
      created_by_username: SYSTEM_NAME,
      action_metadata: {
        key_uuid: key.uuid,
        token_prefix: key.tokenPrefix,
        incubator_uuid: incubator.uuid,
        // hstore est plat : la liste des champs ecrits est jointe.
        fields: Object.keys(parsed.data).join(","),
      },
    });

    revalidatePath(`/incubators/${incubator.uuid}`);

    // Aucune implication entre portees.
    if (!key.has("incubators:read")) return noContent();
    return jsonItem(
      incubatorApiResponseSchema,
      await toRepresentation(updated),
    );
  },
);

export const POST = methodNotAllowed(["GET", "PATCH"]);
export const PUT = methodNotAllowed(["GET", "PATCH"]);
export const DELETE = methodNotAllowed(["GET", "PATCH"]);
