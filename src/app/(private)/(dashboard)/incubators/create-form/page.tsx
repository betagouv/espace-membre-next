import { routeTitles } from "@/lib/routes";
import { Metadata } from "next";
import { redirect } from "next/navigation";

import { IncubatorCreate } from "@/components/IncubatorCreatePage";
import { getAuthSubject } from "@/lib/authorization/subject";
import { db } from "@/lib/kysely";


export const metadata: Metadata = {
  title: `${routeTitles.incubatorCreate()} / Espace Membre`,
};

export default async function Page(props) {
  // Meme verrou que createIncubator : sans lui la page offre un formulaire dont
  // le submit leve AdminAuthorizationError, et la saisie est perdue.
  const subject = await getAuthSubject();
  if (!subject) redirect("/login");
  if (!subject.isAdmin) redirect("/dashboard");

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
