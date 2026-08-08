import { HttpStatusCode } from "axios";

import { getIncubatorByGhid } from "@/lib/kysely/queries/incubators";
import { incubatorApiResponseSchema } from "@/models/incubator";
import { incubatorToModel } from "@/models/mapper";

export const GET = async (
  _: Request,
  { params: { ghid } }: { params: { ghid: string } },
) => {
  const dbIncubator = await getIncubatorByGhid(ghid);
  if (!dbIncubator) {
    return Response.json(
      { error: "No incubator found for this ghid" },
      { status: HttpStatusCode.NotFound },
    );
  }

  const body = incubatorApiResponseSchema.parse(incubatorToModel(dbIncubator));
  return Response.json(body);
};
