import { HttpStatusCode } from "axios";
import { z } from "zod";

import { getStartup } from "@/lib/kysely/queries";
import { getStartupMembers } from "@/lib/kysely/queries/startups";
import { protectedMemberSchema } from "@/models/api/member";
import { CommunicationEmailCode, EmailStatusCode } from "@/models/member";

export const GET = async (
  _: Request,
  segmentData: { params: Promise<{ ghid: string }> },
) => {
  const { ghid } = await segmentData.params;
  const dbStartup = await getStartup({ ghid });
  if (!dbStartup) {
    return Response.json(
      { error: "No startup found for this ghid" },
      { status: HttpStatusCode.NotFound },
    );
  }

  const rows = await getStartupMembers(dbStartup.uuid);
  const members = rows.map((row) => ({
    uuid: row.uuid,
    username: row.username,
    fullname: row.fullname,
    github: row.github,
    primary_email: row.primary_email,
    secondary_email: row.secondary_email,
    communication_email:
      row.communication_email === CommunicationEmailCode.SECONDARY
        ? CommunicationEmailCode.SECONDARY
        : CommunicationEmailCode.PRIMARY,
    primary_email_status:
      (row.primary_email_status as EmailStatusCode) ||
      EmailStatusCode.EMAIL_UNSET,
    missions: row.missions,
  }));

  const body = z.array(protectedMemberSchema).parse(members);
  return Response.json(body);
};
