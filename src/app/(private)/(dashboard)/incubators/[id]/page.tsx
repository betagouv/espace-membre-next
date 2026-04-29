import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";

import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";
import IncubatorPage from "@/components/IncubatorPage/IncubatorPage";
import {
  getIncubator,
  getIncubatorStartups,
  getIncubatorTeams,
} from "@/lib/kysely/queries/incubators";
import { incubatorToModel } from "@/models/mapper";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const params = await props.params;
  // read route params
  const id = params.id;

  const incubator = await getIncubator(id);
  return {
    title: incubator ? `Incubateur ${incubator.ghid} / Espace Membre` : "",
  };
}

export default async function Page(props: Props) {
  const params = await props.params;
  const dbIncubator = await getIncubator(params.id);
  if (!dbIncubator) {
    redirect("/incubators");
  }

  const incubator = incubatorToModel(dbIncubator);
  const startups = await getIncubatorStartups(incubator.uuid);
  const teams = await getIncubatorTeams(incubator.uuid);
  return (
    <>
      <BreadCrumbFiller
        currentPage={incubator.title}
        currentItemId={incubator.uuid}
      />
      <IncubatorPage
        incubatorInfos={incubator}
        startups={startups}
        teams={teams}
      />
    </>
  );
}
