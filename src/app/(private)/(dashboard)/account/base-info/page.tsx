import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { BaseInfoUpdate } from "@/components/BaseInfoUpdatePage";
import { getUserInfo, getAllStartups } from "@/lib/kysely/queries";
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
    const formData = await getUserInfo(username);

    const startups = await getAllStartups();
    const startupOptions = startups.map((startup) => ({
        value: startup.uuid,
        label: startup.name || "",
    }));
    if (!formData) {
        redirect("/errors");
    }

    // todo: to make TS happy
    const domaine = formData.domaine as DomaineSchemaType;

    console.log("formData", JSON.stringify(formData));
    const props = {
        formData: {
            ...formData,
            domaine,
            missions:
                (formData.missions &&
                    formData.missions.length &&
                    formData.missions.map((m) => ({
                        ...m,
                        startups: m.startups.map((s) => s.id),
                    }))) ||
                [],
        },
        startupOptions,
    };

    return <BaseInfoUpdate {...props} />;
}
