import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { BaseInfoUpdate } from "@/components/BaseInfoUpdatePage";
import { getAllStartups } from "@/lib/kysely/queries";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { userInfosToModel } from "@/models/mapper";
import { memberSchema } from "@/models/member";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

export const generateMetadata = async ({
    params: { id },
}: {
    params: { id: string };
}) => {
    const dbData = await getUserInfos({ username: id });

    return {
        title: `Mise à jour des infos de ${dbData?.fullname} / Espace Membre`,
    };
};

export default async function Page({
    params: { id },
}: {
    params: { id: string };
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }
    if (!session.user.isAdmin) {
        redirect(`/community/${id}`);
    }
    const dbData = await getUserInfos({ username: id });
    const userInfos = userInfosToModel(dbData);

    const startups = await getAllStartups();
    const startupOptions = startups.map((startup) => ({
        value: startup.uuid,
        label: startup.name || "",
    }));
    if (!userInfos) {
        redirect("/errors");
    }

    // // todo: to make TS happy
    // const domaine = userInfos.domaine as DomaineSchemaType;
    // const memberType = userInfos.member_type as MemberType;

    const props = {
        formData: {
            member: {
                ...userInfos,
            },
        },
        startupOptions,
        username: id,
    };

    return <BaseInfoUpdate {...props} />;
}
