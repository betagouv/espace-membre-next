import { Metadata } from "next";

import { StartupInfoCreate } from "@/components/StartupInfoCreatePage";
import { db } from "@/lib/kysely";
import betagouv from "@/server/betagouv";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
  title: `${routeTitles.startupCreate()} / Espace Membre`,
};

export default async function Page(props) {
  const incubators = await db.selectFrom("incubators").selectAll().execute(); //await betagouv.incubators();
  const sponsors = await db.selectFrom("organizations").selectAll().execute(); //await betagouv.sponsors();

  return (
    <>
      <h1>{routeTitles.startupCreate()}</h1>
      <StartupInfoCreate
        incubatorOptions={incubators.map((incubator) => {
          return {
            value: incubator.uuid,
            label: incubator.title,
          };
        })}
        sponsorOptions={sponsors.map((incubator) => {
          return {
            value: incubator.uuid,
            label: incubator.name,
          };
        })}
        {...props}
      />
    </>
  );
}
