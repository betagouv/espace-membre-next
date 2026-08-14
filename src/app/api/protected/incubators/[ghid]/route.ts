import { HttpStatusCode } from "axios";

import { getIncubatorByGhid } from "@/lib/kysely/queries/incubators";
import { incubatorApiResponseSchema } from "@/models/api/incubator";
import { incubatorToModel } from "@/models/mapper";

export const GET = async (
  _: Request,
  segmentData: { params: Promise<{ ghid: string }> },
) => {
  const { ghid } = await segmentData.params;
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
