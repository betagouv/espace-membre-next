import { Metadata } from "next";

import { TeamList } from "@/components/team/TeamListPage";
import { getAllTeamsOptions } from "@/lib/kysely/queries/teams";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
  title: `${routeTitles.teamList()} / Espace Membre`,
};

export default async function Page() {
  const teamOptions = await getAllTeamsOptions();
  return (
    <>
      <h1>{routeTitles.teamList()}</h1>
      <TeamList teamOptions={teamOptions} />
    </>
  );
}
