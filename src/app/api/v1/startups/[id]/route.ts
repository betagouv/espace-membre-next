import { revalidatePath } from "next/cache";

import { toResourceRef } from "@/lib/api/identifier";
import { canAccessStartup } from "@/lib/api/perimeter";
import {
  invalidRequest,
  methodNotAllowed,
  problem,
} from "@/lib/api/problem";
import { toApiStartup } from "@/lib/api/startupRepresentation";
import { withApiV1 } from "@/lib/api/withApiV1";
import { addEvent } from "@/lib/events";
import {
  getStartupWithPhases,
  updateStartupDescriptive,
} from "@/lib/kysely/queries/startups";
import { EventCode, SYSTEM_NAME } from "@/models/actionEvent/actionEvent";
import { jsonItem, noContent } from "@/models/api/envelope";
import {
  startupPatchSchema,
  startupWithIncubatorApiResponseSchema,
} from "@/models/api/startup";

export const dynamic = "force-dynamic";

type StartupRow = NonNullable<Awaited<ReturnType<typeof getStartupWithPhases>>>;

/**
 * Le perimetre ne tronque jamais : incubators porte TOUS les incubateurs lies,
 * y compris hors perimetre. Le principal est deduit de cette liste deja triee
 * par titre, ce qui evite une seconde requete vers incubators.
 *
 * La projection vient de toApiStartup, partagee avec la collection : c'est ce
 * qui garantit que les deux routes rendent le meme produit a l'identique.
 */
function toRepresentation(row: StartupRow) {
  const incubator =
    row.incubators.find(({ uuid }) => uuid === row.incubator_id) ?? null;
  return { ...toApiStartup(row), incubator };
}

export const GET = withApiV1<{ id: string }>(
  { scope: "startups:read" },
  async (req, { params, key }) => {
    const startup = await getStartupWithPhases(toResourceRef(params.id));
    if (!startup) {
      return problem("not_found", { instance: req.nextUrl.pathname });
    }
    if (!(await canAccessStartup(key.read, startup.uuid))) {
      return problem("out_of_perimeter", { instance: req.nextUrl.pathname });
    }
    return jsonItem(
      startupWithIncubatorApiResponseSchema,
      toRepresentation(startup),
    );
  },
);

export const PATCH = withApiV1<{ id: string }>(
  { scope: "startups:write", mediaTypes: ["application/merge-patch+json"] },
  async (req, { params, key }) => {
    const startup = await getStartupWithPhases(toResourceRef(params.id));
    if (!startup) {
      return problem("not_found", { instance: req.nextUrl.pathname });
    }
    if (!key.write || !(await canAccessStartup(key.write, startup.uuid))) {
      return problem("out_of_perimeter", { instance: req.nextUrl.pathname });
    }

    const parsed = startupPatchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return invalidRequest(parsed.error, { instance: req.nextUrl.pathname });
    }

    await updateStartupDescriptive(startup.uuid, parsed.data);

    await addEvent({
      action_code: EventCode.STARTUP_API_UPDATED,
      action_on_startup: startup.uuid,
      created_by_username: SYSTEM_NAME,
      action_metadata: {
        key_uuid: key.uuid,
        token_prefix: key.tokenPrefix,
        // hstore est plat : la liste des champs ecrits est jointe.
        fields: Object.keys(parsed.data).join(","),
      },
    });

    revalidatePath(`/startups/${startup.uuid}`);

    // Aucune implication entre portees.
    if (!key.has("startups:read")) return noContent();
    const refreshed = await getStartupWithPhases({ uuid: startup.uuid });
    return jsonItem(
      startupWithIncubatorApiResponseSchema,
      toRepresentation(refreshed!),
    );
  },
);

export const POST = methodNotAllowed(["GET", "PATCH"]);
export const PUT = methodNotAllowed(["GET", "PATCH"]);
export const DELETE = methodNotAllowed(["GET", "PATCH"]);
