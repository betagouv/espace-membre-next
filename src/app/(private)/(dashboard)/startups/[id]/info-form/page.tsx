import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { validate } from "uuid";
import { z } from "zod";

import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";
import { StartupInfoUpdate } from "@/components/StartupInfoUpdatePage";
import { getEventListByStartupUuid } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getStartup } from "@/lib/kysely/queries";
import s3 from "@/lib/s3";
import { startupChangeToModel, startupToModel } from "@/models/mapper";
import { sponsorSchema } from "@/models/sponsor";
import { eventSchema, phaseSchema } from "@/models/startup";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // read route params
  let query: { ghid: string } | { uuid: string } = {
    ghid: params.id,
  };
  if (validate(params.id)) {
    query = {
      uuid: params.id,
    };
  }
  const startup = await getStartup(query);

  return {
    title: `${routeTitles.startupDetailsEdit(startup?.name)} / Espace Membre`,
  };
}

export default async function Page(props) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  const params = props.params;
  let query: { ghid: string } | { uuid: string } = {
    ghid: params.id,
  };
  if (validate(params.id)) {
    query = {
      uuid: params.id,
    };
  }

  const incubators = await db.selectFrom("incubators").selectAll().execute(); //await betagouv.incubators();
  const sponsors = await db.selectFrom("organizations").selectAll().execute(); //await betagouv.sponsors();
  const startup = startupToModel(await getStartup(query));
  if (!startup) {
    redirect("/startups");
  }
  const startupSponsors = z
    .array(sponsorSchema)
    .parse(
      await db
        .selectFrom("organizations")
        .leftJoin(
          "startups_organizations",
          "organization_id",
          "organizations.uuid",
        )
        .where("startup_id", "=", startup.uuid)
        .select([
          "organizations.uuid",
          "organizations.acronym",
          "organizations.type",
          "organizations.domaine_ministeriel",
          "organizations.ghid",
          "organizations.name",
        ])
        .execute(),
    );
  const startupPhases = z
    .array(phaseSchema)
    .parse(
      await db
        .selectFrom("phases")
        .where("startup_id", "=", startup.uuid)
        .orderBy("phases.start asc")
        .selectAll()
        .execute(),
    );
  const startupEvents = z
    .array(eventSchema)
    .parse(
      await db
        .selectFrom("startup_events")
        .where("startup_events.startup_id", "=", startup.uuid)
        .orderBy("startup_events.date asc")
        .selectAll()
        .execute(),
    );
  const s3ShotKey = `startups/${startup.ghid}/shot.jpg`;
  let hasShot = false;
  try {
    const s3Object = await s3
      .getObject({
        Key: s3ShotKey,
      })
      .promise();
    hasShot = true;
  } catch (error) {
    console.log("No image for user");
  }
  const s3HeroKey = `startups/${startup.ghid}/hero.jpg`;
  let hasHero = false;
  try {
    const s3Object = await s3
      .getObject({
        Key: s3HeroKey,
      })
      .promise();
    hasHero = true;
  } catch (error) {
    console.log("No image for user");
  }

  const changes = await getEventListByStartupUuid(startup.uuid);

  const componentProps = {
    startup,
    startupSponsors,
    startupPhases,
    startupEvents,
    heroURL: hasHero
      ? `/api/image?fileObjIdentifier=${startup.ghid}&fileRelativeObjType=startup&fileIdentifier=hero`
      : undefined,
    shotURL: hasShot
      ? `/api/image?fileObjIdentifier=${startup.ghid}&fileRelativeObjType=startup&fileIdentifier=shot`
      : undefined,
    incubatorOptions: incubators.map((incubator) => {
      return {
        value: incubator.uuid,
        label: incubator.title,
      };
    }),
    sponsorOptions: sponsors.map((incubator) => {
      return {
        value: incubator.uuid,
        label: incubator.name,
      };
    }),
    changes: changes.map((change) => startupChangeToModel(change)),
  };

  return (
    <>
      <BreadCrumbFiller
        currentPage={startup.name}
        currentItemId={startup.uuid}
      />
      <StartupInfoUpdate {...componentProps} />
    </>
  );
}
