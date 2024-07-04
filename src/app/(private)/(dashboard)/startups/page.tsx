import { Metadata } from "next";

import { StartupList } from "@/components/StartupListPage";
import { getAllStartups } from "@/lib/kysely/queries";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.startupList()} / Espace Membre`,
};

export default async function Page() {
    const startups = await getAllStartups().then((r) =>
        r.map((s) => ({
            value: s.uuid,
            label: s.name,
        }))
    );
    return (
        <>
            <h1>{routeTitles.startupList()}</h1>
            <StartupList startups={startups} />;
        </>
    );
}
