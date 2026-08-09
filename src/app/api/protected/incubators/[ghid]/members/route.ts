import { HttpStatusCode } from "axios";
import { NextRequest } from "next/server";
import { z } from "zod";

import {
  getIncubatorByGhid,
  getIncubatorMembers,
} from "@/lib/kysely/queries/incubators";
import { convertSearchParamsToRecord } from "@/lib/url";
import {
  IncubatorMemberAttachment,
  incubatorMemberSchema,
} from "@/models/api/member";
import { CommunicationEmailCode, EmailStatusCode } from "@/models/member";

const queryInput = z.object({
  status: z.literal("active").optional(),
});

export const GET = async (
  req: NextRequest,
  { params: { ghid } }: { params: { ghid: string } },
) => {
  const {
    success,
    data: searchParams,
    error,
  } = queryInput.safeParse(
    convertSearchParamsToRecord(req.nextUrl.searchParams),
  );
  if (!success) {
    return Response.json(
      { error: error.flatten().fieldErrors },
      { status: HttpStatusCode.UnprocessableEntity },
    );
  }

  const incubator = await getIncubatorByGhid(ghid);
  if (!incubator) {
    return Response.json(
      { error: "No incubator found for this ghid" },
      { status: HttpStatusCode.NotFound },
    );
  }

  const rows = await getIncubatorMembers(incubator.uuid);
  const now = new Date();

  let members = rows.map((row) => ({
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
    attachment:
      row.viaStartups && row.viaTeams
        ? IncubatorMemberAttachment.BOTH
        : row.viaStartups
          ? IncubatorMemberAttachment.STARTUPS
          : IncubatorMemberAttachment.TEAMS,
    teams: row.incubatorTeams
      .map((team) => team.ghid)
      .filter((teamGhid): teamGhid is string => !!teamGhid),
    missions: row.missions,
  }));

  // Par defaut on renvoie TOUS les rattaches, missions terminees comprises, pour
  // ne pas masquer les personnes qui viennent de partir (celles dont il faut
  // justement couper les acces). ?status=active ne garde que les membres actifs :
  // au moins une mission en cours, ou un rattachement par equipe (une
  // appartenance a une equipe ne porte pas de date et n'expire donc pas).
  if (searchParams.status === "active") {
    members = members.filter(
      (member) =>
        member.attachment !== IncubatorMemberAttachment.STARTUPS ||
        member.missions.some(
          (mission) => !mission.end || new Date(mission.end) > now,
        ),
    );
  }

  const body = z.array(incubatorMemberSchema).parse(members);
  return Response.json(body);
};
