import yaml from "js-yaml";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import AccountVerifyClientPage, {
    AccountVerifyClientPageProps,
} from "./AccountVerifyClientPage";
import { fetchGithubPageData } from "@/lib/github";
import { StartupInfo } from "@/models/startup";
import betagouv from "@/server/betagouv";
import config from "@/server/config";
import { getDBUser } from "@/server/db/dbUser";
import { getSessionFromStore } from "@/server/middlewares/sessionMiddleware";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.verifyMember()} / Espace Membre`,
};

export default async function CreateMemberPage() {
    const cookieStore = cookies();
    const session = (await getSessionFromStore(
        cookieStore.get(config.SESSION_COOKIE_NAME)
    )) as { id: string };
    if (!session) {
        redirect("/login");
    }

    const username = session.id;

    const formData = await fetchGithubPageData(username, "master");

    const startups = await betagouv.startupsInfos();
    const dbUser = await getDBUser(username);
    const startupOptions = startups.map((startup) => {
        return {
            value: startup.id,
            label: startup.attributes.name,
        };
    });

    const props: AccountVerifyClientPageProps = {
        startupOptions,
        formData: {
            ...formData,
            username,
            email: dbUser?.secondary_email || "",
            gender: dbUser?.gender,
        },
    };

    return <AccountVerifyClientPage {...props} />;
}
