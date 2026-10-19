import { revalidatePath } from "next/cache";

import { toResourceRef } from "@/lib/api/identifier";
import { canAccessStartup } from "@/lib/api/perimeter";
import {
  invalidRequest,
  methodNotAllowed,
  problem,
} from "@/lib/api/problem";
import { withApiV1 } from "@/lib/api/withApiV1";
import { addEvent } from "@/lib/events";
import { getStartup } from "@/lib/kysely/queries";
import { updateStartupStandards } from "@/lib/kysely/queries/startups";
import { EventCode, SYSTEM_NAME } from "@/models/actionEvent/actionEvent";
import { jsonItem, noContent } from "@/models/api/envelope";
import {
  startupStandardsPatchSchema,
  startupStandardsResponseSchema,
  startupStandardsSchema,
} from "@/models/api/standards";

export const dynamic = "force-dynamic";

const write = (mode: "replace" | "merge") =>
  withApiV1<{ id: string }>(
    {
      scope: "startups:write",
      mediaTypes:
        mode === "replace"
          ? ["application/json"]
          : ["application/merge-patch+json"],
    },
    async (req, { params, key }) => {
      const startup = await getStartup(toResourceRef(params.id));
      if (!startup) {
        return problem("not_found", { instance: req.nextUrl.pathname });
      }
      if (!key.write || !(await canAccessStartup(key.write, startup.uuid))) {
        return problem("out_of_perimeter", { instance: req.nextUrl.pathname });
      }

      // PUT : remplacement complet, tous les champs requis (nullable mais
      // presents). PATCH (RFC 7396) : seuls les champs presents sont ecrits,
      // null efface.
      const schema =
        mode === "replace"
          ? startupStandardsSchema
          : startupStandardsPatchSchema;
      const parsed = schema.safeParse(await req.json());
      if (!parsed.success) {
        return invalidRequest(parsed.error, { instance: req.nextUrl.pathname });
      }

      const updated = await updateStartupStandards(startup.uuid, parsed.data);

      await addEvent({
        action_code: EventCode.STARTUP_STANDARDS_UPDATED,
        action_on_startup: startup.uuid,
        created_by_username: SYSTEM_NAME,
        action_metadata: {
          key_uuid: key.uuid,
          token_prefix: key.tokenPrefix,
          // hstore est plat : la liste des champs ecrits est jointe, pas
          // imbriquee.
          fields: Object.keys(parsed.data).join(","),
        },
      });

      revalidatePath(`/startups/${startup.uuid}`);

      // Aucune implication entre portees.
      if (!key.has("startups:read")) return noContent();
      return jsonItem(startupStandardsResponseSchema, updated);
    },
  );

export const PUT = write("replace");
export const PATCH = write("merge");

export const GET = methodNotAllowed(["PUT", "PATCH"]);
export const POST = methodNotAllowed(["PUT", "PATCH"]);
export const DELETE = methodNotAllowed(["PUT", "PATCH"]);
