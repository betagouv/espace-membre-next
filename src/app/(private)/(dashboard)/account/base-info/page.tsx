import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { BaseInfoUpdate } from "@/components/BaseInfoUpdatePage";
import { getUserDetails, getAllStartups } from "@/lib/kysely/queries";
import { DomaineSchemaType } from "@/models/member";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.accountEditBaseInfo()} / Espace Membre`,
};

export default async function Page() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }
    const username = session.user.id;
    const userDetails = await getUserDetails(username);

    const startups = await getAllStartups();
    const startupOptions = startups.map((startup) => ({
        value: startup.uuid,
        label: startup.name || "",
    }));
    if (!userDetails) {
        redirect("/errors");
    }

    // todo: to make TS happy
    const domaine = userDetails.domaine as DomaineSchemaType;

    const props = {
        formData: {
            ...userDetails,
            domaine,
        },
        startupOptions,
    };

    return <BaseInfoUpdate {...props} />;
}
