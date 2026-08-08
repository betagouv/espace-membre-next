import { HttpStatusCode } from "axios";

import { getStartup } from "@/lib/kysely/queries";
import { getIncubator } from "@/lib/kysely/queries/incubators";
import { incubatorToModel, startupToModel } from "@/models/mapper";
import { startupWithIncubatorApiResponseSchema } from "@/models/startup";

// On conserve la semantique existante : le parametre de chemin est le ghid.
export const GET = async (
  _: Request,
  { params: { ghid } }: { params: { ghid: string } },
) => {
  const dbStartup = await getStartup({ ghid });
  if (!dbStartup) {
    return Response.json(
      { error: "No startup found for this ghid" },
      { status: HttpStatusCode.NotFound },
    );
  }

  const startup = startupToModel(dbStartup);
  const incubator = startup.incubator_id
    ? incubatorToModel(await getIncubator(startup.incubator_id))
    : null;

  const body = startupWithIncubatorApiResponseSchema.parse({
    ...startup,
    incubator,
  });
  return Response.json(body);
};
