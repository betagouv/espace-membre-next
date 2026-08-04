import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";

import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";
import TeamPage, { TeamPageProps } from "@/components/team/TeamPage/Team";
import { db } from "@/lib/kysely";
import { getIncubator } from "@/lib/kysely/queries/incubators";
import { getTeam } from "@/lib/kysely/queries/teams";
import {
  teamToModel,
  memberPublicInfoToModel,
  incubatorToModel,
} from "@/models/mapper";
import { memberBaseInfoSchema, memberSchema } from "@/models/member";
import { incubator } from "@/scripts/github-schemas";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const params = await props.params;
  // read route params
  const id = params.id;

  const team = await getTeam(id);
  return {
    title: team ? `Équipe ${team.name} / Espace Membre` : "",
  };
}

export default async function Page(props: Props) {
  const params = await props.params;
  const dbTeam = await getTeam(params.id);

  if (!dbTeam) {
    redirect("/teams");
  }
  const incubator = await getIncubator(dbTeam.incubator_id);
  if (!incubator) {
    throw new Error("An incubator should exist of incubator.uuid");
  }

  const teamMembers = (
    await db
      .selectFrom("users")
      .selectAll()
      .innerJoin("users_teams", "users.uuid", "users_teams.user_id")
      .where("users_teams.team_id", "=", params.id)
      .execute()
  ).map((user) =>
    memberPublicInfoToModel({
      ...user,
      missions: [], // for TS
      teams: [], // for TS
    }),
  );
  const team = teamToModel(dbTeam);
  return (
    <>
      <BreadCrumbFiller currentPage={team.name} currentItemId={team.uuid} />
      <TeamPage
        incubator={incubatorToModel(incubator)}
        teamInfos={team}
        teamMembers={teamMembers || []}
      />
    </>
  );
}
