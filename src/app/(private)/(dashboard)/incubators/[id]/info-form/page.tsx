import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { IncubatorUpdate } from "@/components/IncubatorUpdatePage";
import { db } from "@/lib/kysely";
import { getIncubator } from "@/lib/kysely/queries/incubators";
import { incubatorToModel } from "@/models/mapper";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

type Props = {
    params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // read route params
    const id = params.id;
    const incubator = await getIncubator(id);

    return {
        title: `${routeTitles.incubatorDetailsEdit(
            incubator?.title
        )} / Espace Membre`,
    };
}

export default async function Page(props: Props) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }
    const uuid = props.params.id;
    const dbIncubator = await db
        .selectFrom("incubators")
        .selectAll()
        .where("uuid", "=", uuid)
        .executeTakeFirst();

    if (!dbIncubator) {
        redirect("/incubators");
    }

    const startups = await db.selectFrom("startups").selectAll().execute();

    const sponsors = await db.selectFrom("organizations").selectAll().execute();

    const s3LogoKey = `incubators/${dbIncubator.ghid}/logo.jpg`;
    let hasLogo = false;
    try {
        const s3Object = await s3
            .getObject({
                Key: s3LogoKey,
            })
            .promise();
        hasLogo = true;
    } catch (error) {
        console.log("No image for user");
    }
    const logoURL = hasLogo
        ? `/api/image?fileObjIdentifier=${dbIncubator.ghid}&fileRelativeObjType=incubator&fileIdentifier=logo`
        : undefined;

    const incubator = incubatorToModel(dbIncubator);
    const componentProps = {
        incubator,
        sponsorOptions: sponsors.map((incubator) => {
            return {
                value: incubator.uuid,
                label: incubator.name,
            };
        }),
        startupOptions: (startups || []).map((startup) => {
            return {
                value: startup.uuid,
                label: startup.name,
            };
        }),
        logoURL,
    };

    return <IncubatorUpdate {...componentProps} />;
}
