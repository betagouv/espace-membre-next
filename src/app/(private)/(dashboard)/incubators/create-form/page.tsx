import { routeTitles } from "@/lib/routes";
import { Metadata } from "next";

import { IncubatorCreate } from "@/components/IncubatorCreatePage";
import { db } from "@/lib/kysely";


export const metadata: Metadata = {
  title: `${routeTitles.incubatorCreate()} / Espace Membre`,
};

export default async function Page(props) {
  const sponsors = await db.selectFrom("organizations").selectAll().execute(); //await betagouv.sponsors();
  const startups = await db.selectFrom("startups").selectAll().execute(); //await betagouv.sponsors();

  return (
    <>
      <h1>{routeTitles.incubatorCreate()}</h1>
      <IncubatorCreate
        startupOptions={startups.map((startup) => {
          return {
            value: startup.uuid,
            label: startup.name,
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
